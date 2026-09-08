export type SendEmailPayload = {
  subject: string;
  sentTo: string;
  ccTo?: string;
  message: string;
  systemName: string;
};

export type SendEmailResponse = {
  success: true;
  message: string;
};

export type GetTokenResponse = {
  success: true;
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
};

export class EmailApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "EmailApiError";
  }
}
