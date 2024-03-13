import { AxiosError, AxiosRequestConfig } from 'axios';

export type FetchWithOptions = AxiosRequestConfig;

export interface HTTPError extends AxiosError {
  message: string;
  httpStatus?: string;
  descriptionMessage?: string;
}

export interface Site {
  identity: string;
  name: string;
  ingress: string;
  routerVersion: string;
  controllerVersion: string;
  linkCount: number;
  creationTimestamp: number;
}

export interface Token {
  id: string;
  name: string;
  creationTimestamp: string;
  claimsMade?: string;
  claimsRemaining: string;
  claimExpiration: string;
}

export interface Link {
  id: string;
  name: string;
  creationTimestamp: string;
  status: string | undefined;
  cost: string;
  connectedTo: string;
}

export type Listener = {
  id: string;
  name: string;
  creationTimestamp: string;
  routingKey: string;
  serviceName: string;
  port: string;
  protocol: string;
};

export type Connector = {
  id: string;
  host: string;
  creationTimestamp: string;
  selector: string;
  port: string;
  protocol: string;
  routingKey: string;
};
