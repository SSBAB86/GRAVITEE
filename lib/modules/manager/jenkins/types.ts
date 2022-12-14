export interface JenkinsPluginRenovate {
  ignore?: boolean;
}

export interface JenkinsPluginSource {
  version?: string | number;
  url?: string;
}

export interface JenkinsPlugin {
  artifactId?: string;
  groupId?: string;
  source?: JenkinsPluginSource;
  renovate?: JenkinsPluginRenovate;
}

export interface JenkinsPlugins {
  plugins?: JenkinsPlugin[];
}
