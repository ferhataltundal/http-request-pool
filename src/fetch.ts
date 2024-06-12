//REQUEST FOR CLIENT SIDE

type ServerReturnType<T> = {
  isLoaded: boolean;
  isError: boolean;
  errorMessage: string | null;
  sequence: number;
  response: T;
  requestTime: number;
  ping: number;
};

async function startServer<K>(
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
  requestFrequency = 3000
): Promise<ServerReturnType<K>> {
  let timer: NodeJS.Timeout;
  let isLoaded = false;
  let isError = false;
  let errorMessage: string | null = null;
  let sequence = 0;
  let response: K;
  let requestTime: number = 0;
  let ping: number = 0;

  async function fetchReq() {
    requestTime = Date.now();
    try {
      const res = await fetch(input, init);
      if (!res.ok) {
        isError = true;
        let errorText = `Request failed with status: ${res.status}`;
        errorMessage = errorText;
        throw new Error(errorText);
      }
      const data = await res.json();
      isLoaded = true;
      isError = false;
      response = data;
    } catch (error) {
      isError = true;
      isLoaded = false;
      errorMessage = String(error);
    }
    ping = Date.now() - requestTime;
    sequence++;
  }

  return new Promise(async (resolve) => {
    await fetchReq();
    if (isError) {
      timer = setInterval(() => {
        fetchReq();
      }, requestFrequency);
    } else {
      clearInterval(timer);
    }
    return resolve({
      isLoaded,
      isError,
      sequence,
      errorMessage,
      response,
      requestTime: Math.floor(requestTime / 1000),
      ping,
    });
  }) as Promise<ServerReturnType<K>>;
}

async function requestPool<T>(
  input: RequestInfo | URL,
  queries: {
    key: string;
    data: unknown;
    res?: (data: ServerReturnType<any>) => unknown;
  }[],
  init?: RequestInit | undefined
): Promise<{ [key: string]: ServerReturnType<T> }> {
  const results: { [key: string]: ServerReturnType<T> } = {};
  for (let i = 0; i < queries.length; i++) {
    const response = await startServer<T>(`${input}${queries[i].data}`, init);
    results[queries[i].key] = { ...response } as ServerReturnType<T>;
    if (queries[i].res) {
      queries[i]?.res?.apply(null, [response]);
    }
  }
  return results;
}

interface AllDataType {
  data_1: {
    body: string;
    id: number;
    title: string;
    userId: number;
  }[];
  data_2: {
    completed: boolean;
    id: number;
    title: string;
    userId: number;
  }[];
}

requestPool<AllDataType>(
  "https://example.com",
  [
    {
      key: "data_1",
      data: "/comments",
      res(res) {
        console.log(res); //Get selected response
      },
    },
    {
      key: "data_2",
      data: "/todos",
    },
  ],
  {
    headers: {
      "api-key": "xTD4s3d9j3",
    },
    //Other configs...
  }
).then((response) => response); //Get all response
