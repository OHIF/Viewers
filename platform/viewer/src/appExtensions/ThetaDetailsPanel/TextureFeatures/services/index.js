import { TextureApi } from './api/texture';
import { JobsApi } from './api/jobs';

export const APIs = {
  texture: new TextureApi(),
  jobs: new JobsApi(),
}
