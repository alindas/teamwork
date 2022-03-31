import { Loading, Notification } from '../components';

interface Response {
  err?: string;
  data?: any;
};

interface Parameter {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  showLoading?: boolean;
  success?: (data: any) => void;
}

export const request = (param: Parameter) => {
  const { url, method = 'GET', data, showLoading = true, success } = param;
  let init: RequestInit = { method, credentials: "include" };
  const actually_url = process.env.NODE_ENV === 'production' ? url : `/api${url}`;
  if (data instanceof FormData || data instanceof URLSearchParams) {
    init.body = data
  } else {
    init.headers = { 'content-type': 'application/json' }
    init.body = JSON.stringify(data);
  }

  let finish = () => { !showLoading && Loading.hide(); }
  if (!showLoading) Loading.show();

  if (success == null) {
    return fetch(actually_url, init)
  } else {
    fetch(actually_url, init)
      .then(res => res.json())
      .then((rsp: Response) => rsp.err ?
        Notification.alert(rsp.err, 'error')
        : success(rsp.data)
      )
      .catch(() => null)
      .then(finish);
  }
};
