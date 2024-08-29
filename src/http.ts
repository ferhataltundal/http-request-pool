//HTTP REQUEST FOR SERVER SIDE

import * as https from "https";
import * as http from "http";

export type ResponseType<T> = {
  isError: boolean;
  message: string | null | undefined | object | Error | unknown;
  response: T | null | undefined | string;
};

export type Config = http.RequestOptions | https.RequestOptions;

export type MultipleRequestType = {
  key: string;
  method: string;
  path: string;
  config?: Config;
  data?: any;
  response?: (response: any) => unknown;
};

export class InitServer {
  private configureServer: string | URL = "";
  private defaultConfig: Config = {};
  constructor(configureServer: string | URL, defaultConfig?: Config) {
    this.configureServer = configureServer;
    this.defaultConfig = defaultConfig || {};
  }

  private response<K>(set: ResponseType<K>) {
    return set;
  }

  public async createRequestPool<K>(
    configs: MultipleRequestType[]
  ): Promise<never | { [key: string]: K }> {
    const store: { [key: string]: K } = {};
    const request = this.REQUEST;
    return await new Promise(async (resolve, reject) => {
      if (configs.length > 0) {
        for (let i = 0; i < configs.length; i++) {
          const conf = configs[i];
          store[conf.key] = await (<K>(
            request
              .apply(this, [
                conf.method,
                conf.path,
                { config: conf?.config, data: conf?.data },
              ])
              .then((response) => response)
          ));
          await configs[i].response?.apply(this, [store[conf.key]]);
        }
        resolve(store);
      }
      return reject(
        new Error("There must be at least one request parameter entry.")
      );
    });
  }

  public async REQUEST<K>(
    method: string,
    path: string,
    opt: {
      data?: any;
      config?: Config;
    }
  ): Promise<ResponseType<K>> {
    const newURL = new URL(this.configureServer);
    try {
      return await new Promise((resolve, reject) => {
        if (!newURL) {
          return reject(() => new Error(`URL not found! (${newURL})`));
        }

        let req;
        if (newURL.toString().startsWith("https")) {
          req = https;
        } else {
          req = http;
        }

        const options: typeof opt.config = {
          ...this.defaultConfig,
          ...opt.config,
          headers: {
            ...this.defaultConfig?.headers,
            ...opt.config?.headers,
          },
          method: method,
          path: path,
          protocol: newURL.protocol,
          hostname: newURL.hostname,
        };

        const request = req.request(options, (res: http.IncomingMessage) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });

          return res.on("end", () => {
            try {
              const parsedData = JSON.parse(data);
              resolve(
                this.response<K>({
                  isError: false,
                  message: null,
                  response: parsedData,
                })
              );
            } catch (error) {
              resolve(
                this.response<K>({
                  isError: true,
                  message: error,
                  response: data,
                })
              );
            }
          });
        });
        request.on("error", (err) => reject(err));
        if (opt.data !== undefined) {
          request.write(opt?.data);
        }
        request.end();
      });
    } catch (e) {
      return this.response<K>({
        isError: true,
        message: e,
        response: null,
      });
    }
  }
}

//Enter a url, if you want to define default config, you can set here.
const initServer = new InitServer("https://example.com", {
  headers: {
    "Content-Type": "application/json",
    "app-access-key": "021983791",
  },
});

//Example
const pool: any[] = [];

//You can send multiple request with createRequestPool function.
initServer
  .createRequestPool([
    {
      method: "GET",
      key: "ferhat", //Provide a unique key for access
      path: "/todos/1",
      response(res2) {
        console.log(res2);
        pool.push(res2.response); //Response for this path
      },
    },
    {
      method: "GET",
      key: "2",
      path: "/users",
    },
    {
      method: "GET",
      key: "3",
      path: "/blogs?blogId=2",
    },
  ])
  .then((allResponse) => console.log(allResponse)); //You can also get all the answers.

//You can send requests to any method you want with the REQUEST function.
initServer
  .REQUEST("POST", "/test/imp", {
    data: JSON.stringify({
      username: "admin",
      password: "12345",
    }),
    config: {
      headers: {
        "register-api-key": "1AS9823HD378DH437",
      },
      //Other values...
    },
  })
  .then((response) => console.log(response));
