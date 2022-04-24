export enum HEALTH_CHECK{
  Checking, Passed, Failed, NotStarted
}
export enum SERVER_STATUS {
  Stopped,
  Starting,
  Started,
}

export const HEALTH_CHECK_EVENT = "HEALTH_CHECK_EVENT";

export const IMAGE_SERVER_SERVICE = "MSFS2020MapEnhancementImageServer";
export const NGINX_SERVICE = "MSFS2020MapEnhancementNginx";
