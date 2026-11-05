'use strict';

import Homey from 'homey/lib/Homey';
import https from 'https';
import http from 'http';

export default class HttpClient {

    homey: Homey;
    hostname: string;
    useHttps: boolean;

    constructor(homey: Homey, hostname: string, useHttps: boolean) {
        this.homey = homey;
        this.hostname = hostname;
        this.useHttps = useHttps;
    }

    get(path: string, extraHeaders: Record<string, string> = {}) : Promise <string> {
        return new Promise((resolve, reject) => {
            if (!this.hostname) {
                return reject(new Error('Hostname is not set'));
            }

            const homey = this.homey;
            const options = {
                method: 'GET',
                hostname: this.hostname,
                port: this.useHttps ? 443 : 80,
                path: path,
                headers: {
                    'Accept': '*/*',
                    ...extraHeaders,
                },
                maxRedirects: 5,
                rejectUnauthorized: false,
                timeout: 9000,
            };

            homey.log(`sending GET request to "${this.useHttps ? 'https' : 'http'}://${options.hostname}${options.path}"`);

            const httpClient = this.useHttps ? https : http;
            const req = httpClient.request(options, res => {
                homey.log(`http status code: ${res.statusCode}`);

                const data: string[] = [];
                res.on('data', chunk => data.push(chunk));

                res.on('end', () => {
                    homey.log(`response: "${data.join('')}"`);

                    if (res.statusCode !== 200) {
                        return reject(new Error(`Failed to GET url: ${options.path} (status code: ${res.statusCode})`));
                    }

                    return resolve(data.join(''));
                });
            });

            req.setTimeout(options.timeout, function() {
                req.destroy();
            });

            req.on('error', error => {
                homey.error(error);

                if (error.message === 'socket hang up') {
                    return reject(new Error(`Request timed out after ${options.timeout} ms while conneting to ${options.hostname}`));
                }

                return reject(error)
            });

            req.end();
        });
    }

    post(path: string, postData: any) : Promise <string> {
        return this.sendBody('POST', path, postData);
    }

    patch(path: string, patchData: any, extraHeaders: Record<string, string> = {}) : Promise <string> {
        return this.sendBody('PATCH', path, patchData, extraHeaders);
    }

    private sendBody(method: string, path: string, postData: any, extraHeaders: Record<string, string> = {}) : Promise <string> {
        return new Promise((resolve, reject) => {
            if (!this.hostname) {
                return reject(new Error('Hostname is not set'));
            }

            const homey = this.homey;
            const body = JSON.stringify(postData);
            const options = {
                method: method,
                hostname: this.hostname,
                port: this.useHttps ? 443 : 80,
                path: path,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Length': Buffer.byteLength(body),
                    'Accept': '*/*',
                    ...extraHeaders,
                },
                maxRedirects: 5,
                rejectUnauthorized: false,
                timeout: 9000,
            };

            homey.log(`sending ${method} request to "${this.useHttps ? 'https' : 'http'}://${options.hostname}${options.path}"`);
            homey.log(`body: "${body}"`);

            const httpClient = this.useHttps ? https : http;
            const req = httpClient.request(options, res => {
                homey.log(`http status code: ${res.statusCode}`);

                const data: string[] = [];
                res.on('data', chunk => data.push(chunk));

                res.on('end', () => {
                    homey.log(`response: "${data.join('')}"`);

                    if (res.statusCode !== 200) {
                        return reject(new Error(`Failed to ${method} to url: ${options.path} (status code: ${res.statusCode})`));
                    }

                    return resolve(data.join(''));
                });
            });

            req.setTimeout(options.timeout, function() {
                req.destroy();
            });

            req.on('error', error => {
                homey.error(error);

                if (error.message === 'socket hang up') {
                    return reject(new Error(`Request timed out after ${options.timeout} ms while conneting to ${options.hostname}`));
                }

                return reject(error)
            });
            req.write(body);
            req.end();
        });
    }
}