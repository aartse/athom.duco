'use strict';

import Homey from 'homey/lib/Homey';
import DucoApi from './types/DucoApi';
import DucoCommunicationPrintApi from './DucoCommunicationPrintApi';
import DucoConnectivityBoardApi from './DucoConnectivityBoardApi';

let ducoApi: DucoApi|null = null;

/**
 * TODO: REMOVE THIS FILE WHEN PAIRING IS REFACTORED!
 */
export default class DucoApiFactory {
    static create(homey: Homey): DucoApi {
      if (!ducoApi) {
        const apiType = homey.settings.get('apiType');

        homey.log('using API "'+apiType+'"');

        ducoApi = 'communication_print' === apiType
          ? new DucoCommunicationPrintApi(homey,{
                id: 0,
                name: 'DucoBox',
                hostname: homey.settings.get('hostname'),
                useHttps: homey.settings.get('useHttps') === null || homey.settings.get('useHttps') === true,
                apiType: homey.settings.get('apiType') || 'connectivity_board'
            })
          : new DucoConnectivityBoardApi(homey,{
                id: 0,
                name: 'DucoBox',
                hostname: homey.settings.get('hostname'),
                useHttps: homey.settings.get('useHttps') === null || homey.settings.get('useHttps') === true,
                apiType: homey.settings.get('apiType') || 'connectivity_board'
            });
      }

      return ducoApi;
    }
}
