import { VideoProject } from "./video-project";

export type SerializedVideoProject = string;

export function serializeVideoProject(project: VideoProject): SerializedVideoProject {
  return JSON.stringify(project);
}

export function deserializeVideoProject(input: SerializedVideoProject): VideoProject {
  return JSON.parse(input) as VideoProject;
}

