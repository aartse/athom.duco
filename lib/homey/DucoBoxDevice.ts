import DucoDevice from './DucoDevice';
import AppService from '../AppService';
import DucoApi from '../api/types/DucoApi';
import NodeConfig from '../api/types/NodeConfig';
import NodeActionEnum from '../api/types/NodeActionEnum';

// How often the box configuration is read back into the device settings,
// so changes made in the Duco Installation App show up in Homey.
const CONFIG_SYNC_INTERVAL_MS = 10 * 60 * 1000;
const CONFIG_SYNC_INITIAL_DELAY_MS = 15 * 1000;

// Duco recommends at most one write every 2 seconds.
const WRITE_SPACING_MS = 2000;

// The level the "set ventilation percentage" action uses as its carrier.
const STEPLESS_STATE = 'CNT2';
const STEPLESS_PARAMETER = 'FlowLvlMan2';

interface ConfigSetting {
    setting: string
    parameter: string
    // Parameters in the same chain must stay ordered (rank 1 <= rank 2 <= rank 3).
    chain: string|null
    rank: number
}

const CONFIG_SETTINGS: ConfigSetting[] = [
    { setting: 'flow_level_man1', parameter: 'FlowLvlMan1', chain: 'man', rank: 1 },
    { setting: 'flow_level_man2', parameter: 'FlowLvlMan2', chain: 'man', rank: 2 },
    { setting: 'flow_level_man3', parameter: 'FlowLvlMan3', chain: 'man', rank: 3 },
    { setting: 'flow_level_auto_min', parameter: 'FlowLvlAutoMin', chain: 'auto', rank: 1 },
    { setting: 'flow_level_auto_max', parameter: 'FlowLvlAutoMax', chain: 'auto', rank: 2 },
    { setting: 'time_man', parameter: 'TimeMan', chain: null, rank: 0 },
];

/**
 * Base class for the DucoBox node itself (node type BOX). Adds access to the box
 * configuration: the flow percentage of each level, the AUTO range and the manual timer.
 */
export default class DucoBoxDevice extends DucoDevice {

    configSyncIntervalId: any = null
    configSyncTimeoutId: any = null
    configQueue: Promise<any> = Promise.resolve()

    async onInit() {
        await super.onInit();

        this.configSyncTimeoutId = this.homey.setTimeout(() => this.syncSettingsFromBox(), CONFIG_SYNC_INITIAL_DELAY_MS);
        this.configSyncIntervalId = this.homey.setInterval(() => this.syncSettingsFromBox(), CONFIG_SYNC_INTERVAL_MS);
    }

    async onUninit() {
        this.stopConfigSync();
    }

    async onDeleted() {
        this.stopConfigSync();
    }

    stopConfigSync() {
        if (this.configSyncTimeoutId) {
            this.homey.clearTimeout(this.configSyncTimeoutId);
            this.configSyncTimeoutId = null;
        }
        if (this.configSyncIntervalId) {
            this.homey.clearInterval(this.configSyncIntervalId);
            this.configSyncIntervalId = null;
        }
    }

    getConfigApi(): DucoApi {
        const ducoApi = AppService.create(this.homey).getDucoApi(this.getDucoBoxId());
        if (null === ducoApi) {
            throw new Error('No duco box found with id '+this.getDucoBoxId());
        }
        if (!ducoApi.supportsNodeConfig()) {
            throw new Error(this.homey.__('errors.config_not_supported'));
        }

        return ducoApi;
    }

    /**
     * Read the box configuration. Without a valid Api-Key the board silently returns only the
     * public parameters (just the name), so treat a missing level parameter as an error.
     */
    private async readBoxConfig(api: DucoApi): Promise<NodeConfig> {
        const config = await api.getNodeConfig(this.getDucoNodeId());
        if (!config.FlowLvlMan1) {
            throw new Error(this.homey.__('errors.config_unavailable'));
        }

        return config;
    }

    /**
     * Serialize all configuration reads and writes, so concurrent flows cannot interleave.
     */
    private enqueue<T>(task: () => Promise<T>): Promise<T> {
        const run = this.configQueue.then(task, task);
        this.configQueue = run.catch(() => null);

        return run;
    }

    async syncSettingsFromBox(): Promise<void> {
        let config: NodeConfig;
        try {
            config = await this.enqueue(() => this.readBoxConfig(this.getConfigApi()));
        } catch (error) {
            // Communication Print boards or an unreachable box: keep the current settings.
            this.homey.log('unable to sync box configuration: '+error);
            return;
        }

        await this.applyConfigToSettings(config);
    }

    async applyConfigToSettings(config: NodeConfig): Promise<void> {
        const current = this.getSettings();
        const changes: Record<string, any> = {};

        for (const configSetting of CONFIG_SETTINGS) {
            const value = this.getParameterValue(config, configSetting.parameter);
            if (null !== value && current[configSetting.setting] !== value) {
                changes[configSetting.setting] = value;
            }
        }

        const flowMax = this.getParameterValue(config, 'FlowMax');
        const flowMaxLabel = null !== flowMax ? flowMax+' m³/h' : '-';
        if (current['flow_max'] !== flowMaxLabel) {
            changes['flow_max'] = flowMaxLabel;
        }

        if (Object.keys(changes).length > 0) {
            this.homey.log('updating settings from box configuration: '+JSON.stringify(changes));
            await this.setSettings(changes);
        }
    }

    async onSettings({ oldSettings, newSettings, changedKeys }: { oldSettings: any, newSettings: any, changedKeys: string[] }): Promise<string|void> {
        const changedConfigSettings = CONFIG_SETTINGS.filter(configSetting => changedKeys.includes(configSetting.setting));
        if (changedConfigSettings.length === 0) {
            return;
        }

        await this.enqueue(async () => {
            const api = this.getConfigApi();
            const config = await this.readBoxConfig(api);

            // Changed settings come from the dialog, everything else from the box itself.
            const values: Record<string, number> = {};
            for (const configSetting of CONFIG_SETTINGS) {
                values[configSetting.parameter] = changedKeys.includes(configSetting.setting)
                    ? Number(newSettings[configSetting.setting])
                    : Number(this.getParameterValue(config, configSetting.parameter));
            }
            this.validateChains(values);

            const writes = changedConfigSettings
                .map(configSetting => ({
                    configSetting,
                    oldValue: this.getParameterValue(config, configSetting.parameter),
                    newValue: values[configSetting.parameter],
                }))
                .filter(write => write.oldValue !== write.newValue);

            // Raise the highest level first and lower the lowest level first,
            // so every single write keeps the chain in order on the box.
            const raises = writes.filter(w => null === w.oldValue || w.newValue > w.oldValue).sort((a, b) => b.configSetting.rank - a.configSetting.rank);
            const lowers = writes.filter(w => null !== w.oldValue && w.newValue < w.oldValue).sort((a, b) => a.configSetting.rank - b.configSetting.rank);

            let latest = config;
            for (const write of [...raises, ...lowers]) {
                this.checkParameterRange(latest, write.configSetting.parameter, write.newValue);
                if (latest !== config) {
                    await this.sleep(WRITE_SPACING_MS);
                }
                this.homey.log(`writing ${write.configSetting.parameter}: ${write.oldValue} -> ${write.newValue}`);
                latest = await api.patchNodeConfig(this.getDucoNodeId(), { [write.configSetting.parameter]: write.newValue });
            }
        });

        // The settings dialog saves its own values; read back anything else that changed.
        this.homey.setTimeout(() => this.syncSettingsFromBox(), 1000);
    }

    /**
     * Set the flow percentage of ventilation level 1, 2 or 3.
     */
    async setFlowLevelPercentage(level: number, percentage: number): Promise<void> {
        const parameter = 'FlowLvlMan'+level;
        const config = await this.enqueue(async () => {
            const api = this.getConfigApi();
            const config = await this.readBoxConfig(api);
            const value = this.roundToIncrement(config, parameter, percentage);

            if (this.getParameterValue(config, parameter) === value) {
                return config;
            }

            this.checkParameterRange(config, parameter, value);
            this.homey.log(`writing ${parameter}: ${this.getParameterValue(config, parameter)} -> ${value}`);

            return api.patchNodeConfig(this.getDucoNodeId(), { [parameter]: value });
        });

        await this.applyConfigToSettings(config);
    }

    /**
     * Stepless ventilation: put the box on permanent level 2 and set the flow percentage of that level.
     * The percentage is limited to the range between level 1 and level 3.
     */
    async setVentilationPercentage(percentage: number): Promise<void> {
        const config = await this.enqueue(async () => {
            const api = this.getConfigApi();
            const config = await this.readBoxConfig(api);
            const parameter = config[STEPLESS_PARAMETER] as { Min?: number, Max?: number } | undefined;

            let value = this.roundToIncrement(config, STEPLESS_PARAMETER, percentage);
            if (parameter && typeof parameter.Min === 'number') {
                value = Math.max(value, parameter.Min);
            }
            if (parameter && typeof parameter.Max === 'number') {
                value = Math.min(value, parameter.Max);
            }

            if (this.getParameterValue(config, STEPLESS_PARAMETER) === value) {
                return config;
            }

            this.homey.log(`writing ${STEPLESS_PARAMETER}: ${this.getParameterValue(config, STEPLESS_PARAMETER)} -> ${value}`);

            return api.patchNodeConfig(this.getDucoNodeId(), { [STEPLESS_PARAMETER]: value });
        });

        await this.applyConfigToSettings(config);

        // Switching the state uses the daily write budget of the box, so only do it when needed.
        if (this.getCapabilityValue('ventilation_state') !== STEPLESS_STATE) {
            await this.postNodeAction({
                Action: NodeActionEnum.SetVentilationState,
                Val: STEPLESS_STATE,
            });

            this.homey.api.realtime('ventilation_state_changed', {
                device_id: this.getAppId(),
                old_value: this.getCapabilityValue('ventilation_state'),
                new_value: STEPLESS_STATE,
            });
            await this.setCapabilityValue('ventilation_state', STEPLESS_STATE);
        }

        this.updateNode();
    }

    private validateChains(values: Record<string, number>) {
        for (const value of Object.values(values)) {
            if (!Number.isFinite(value)) {
                throw new Error(this.homey.__('errors.invalid_value'));
            }
        }

        if (!(values.FlowLvlMan1 <= values.FlowLvlMan2 && values.FlowLvlMan2 <= values.FlowLvlMan3)) {
            throw new Error(this.homey.__('errors.levels_out_of_order'));
        }

        if (!(values.FlowLvlAutoMin <= values.FlowLvlAutoMax)) {
            throw new Error(this.homey.__('errors.auto_out_of_order'));
        }
    }

    private checkParameterRange(config: NodeConfig, parameter: string, value: number) {
        const configParameter = config[parameter] as { Min?: number, Max?: number } | undefined;
        if (!configParameter) {
            throw new Error(this.homey.__('errors.parameter_not_supported', { parameter }));
        }

        const min = typeof configParameter.Min === 'number' ? configParameter.Min : -Infinity;
        const max = typeof configParameter.Max === 'number' ? configParameter.Max : Infinity;
        if (value < min || value > max) {
            throw new Error(this.homey.__('errors.out_of_range', { parameter, value, min, max }));
        }
    }

    private roundToIncrement(config: NodeConfig, parameter: string, value: number): number {
        const configParameter = config[parameter] as { Inc?: number } | undefined;
        const increment = configParameter && typeof configParameter.Inc === 'number' && configParameter.Inc > 0 ? configParameter.Inc : 1;

        return Math.round(value / increment) * increment;
    }

    private getParameterValue(config: NodeConfig, parameter: string): number|null {
        const configParameter = config[parameter] as { Val?: unknown } | undefined;

        return configParameter && typeof configParameter.Val === 'number' ? configParameter.Val : null;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => this.homey.setTimeout(resolve, ms));
    }
}
