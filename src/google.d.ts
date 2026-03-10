declare namespace google.accounts.oauth2 {
  interface TokenClient {
    requestAccessToken(config?: { prompt?: string }): void;
  }
  interface TokenResponse {
    access_token: string;
    error?: string;
  }
  function initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
  }): TokenClient;
}

declare namespace gapi {
  function load(api: string, callback: () => void): void;
  namespace client {
    function init(config: object): Promise<void>;
    function load(discoveryDoc: string): Promise<void>;
    namespace calendar.events {
      function list(params: {
        calendarId: string;
        timeMin: string;
        timeMax: string;
        singleEvents: boolean;
        orderBy: string;
        maxResults: number;
      }): Promise<{
        result: {
          items?: Array<{
            summary?: string;
            start?: { dateTime?: string; date?: string };
            end?: { dateTime?: string; date?: string };
          }>;
        };
      }>;
    }
  }
}
