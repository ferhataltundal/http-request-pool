//FOR CLIENT SIDE

export class SendFile {
  private url: RequestInfo | URL = "";
  private init: RequestInit = {};
  constructor(url: RequestInfo | URL, init?: RequestInit) {
    this.url = url;
    this.init = init || {};
  }

  public async sendFile(
    file: File,
    options?: {
      allowedFileType?: {
        allowed?: string[];
        notAllowed?: string[];
      };
      size?: { maxSize?: number; minSize?: number };
    }
  ) {
    const formData = new FormData();
    formData.append("file", file);

    if (
      options?.allowedFileType?.allowed &&
      options?.allowedFileType.allowed.length > 0
    ) {
      if (!options?.allowedFileType.allowed.includes(file.type)) {
        throw new Error(
          `Invalid file type, please select one of the following file types: ${options?.allowedFileType.allowed.join(
            ","
          )}`
        );
      }
    }
    if (
      options?.allowedFileType?.notAllowed &&
      options?.allowedFileType.notAllowed.length > 0
    ) {
      if (!options?.allowedFileType.notAllowed.includes(file.type)) {
        throw new Error(
          `This file type not valid, please enter a valid types: ${options?.allowedFileType.notAllowed.join(
            ","
          )}`
        );
      }
    }
    if (options?.size) {
      if (options?.size.maxSize) {
        if (file.size > options?.size.maxSize * 1024 * 1024) {
          throw new Error(`Maximum file size is ${options?.size.maxSize} MB!`);
        }
      }
      if (options?.size.minSize) {
        if (file.size > options?.size.minSize * 1024 * 1024) {
          throw new Error(`Minimum file size is ${options?.size.maxSize} MB!`);
        }
      }
    }
    const response = await fetch(this.url, {
      method: "POST",
      body: formData,
      ...this.init,
    });
    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }
  }
}

//Using

const send = new SendFile("https://example.com", {});
const FILE: File = "select_a_type";

send.sendFile(FILE, {
  allowedFileType: {
    allowed: ["application/zip", "image/jpeg", "application/pdf"], //Allowed file types (optional)
    notAllowed: [], //Unaccepted file types (optional)
  },
  size: {
    maxSize: 10, //Max size (mb) (optional)
    minSize: 1, //Min size (mb) (optional)
  },
});
