export type FFmpegInputSpec = {
  id: string;
  uri: string;
  args: string[];
};

export type FFmpegFilterNode = {
  inputLabels: string[];
  filter: string;
  outputLabel?: string;
};

export type FFmpegCommandSpec = {
  inputs: FFmpegInputSpec[];
  filterGraph: FFmpegFilterNode[];
  outputArgs: string[];
  command: string[];
};
