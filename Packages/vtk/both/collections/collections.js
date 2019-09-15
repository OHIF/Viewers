import { Mongo } from 'meteor/mongo';
import { PipelineSchema } from 'meteor/gtajesgenga:vtk/both/schema/Pipelines.js';

const Pipelines = new Mongo.Collection("pipelines");

Pipelines.schema = PipelineSchema;

export { Pipelines };
