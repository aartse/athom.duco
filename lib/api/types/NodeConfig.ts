export = NodeConfig;

/**
 * A single configuration parameter as returned by GET /config/nodes/{node}.
 * Min/Max/Inc are omitted for read-only or free-text parameters such as Name.
 */
interface NodeConfigParameter {
    Val: number
    Min?: number
    Max?: number
    Inc?: number
}

/**
 * Node configuration of the Connectivity Board (requires an Api-Key).
 * Only the parameters this app reads or writes are typed explicitly.
 */
interface NodeConfig {
    Node: number
    FlowMax?: NodeConfigParameter
    FlowLvlAutoMin?: NodeConfigParameter
    FlowLvlAutoMax?: NodeConfigParameter
    FlowLvlMan1?: NodeConfigParameter
    FlowLvlMan2?: NodeConfigParameter
    FlowLvlMan3?: NodeConfigParameter
    TimeMan?: NodeConfigParameter
    [parameter: string]: NodeConfigParameter | number | undefined | { Val: string }
}
