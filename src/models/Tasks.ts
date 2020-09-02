import { Document, Model, model, Schema, SchemaDefinition, SchemaOptions, NativeError } from 'mongoose';
import { TasksStatus } from '+interfaces/enums';

export interface TasksInterface {
    title: string;
    description: string;
    due: Date;
    status: TasksStatus;
    createdAt: Date;
    updatedAt: Date;
    categories?: string[];
}

export interface TasksInterfaceDocument extends TasksInterface, Document {}

export type TasksModel = Model<TasksInterfaceDocument>;

class TasksSchema extends Schema {
    constructor() {
        const schema: SchemaDefinition = {
            title: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            due: {
                type: Date,
                required: true
            },
            categories: [
                {
                    type: String,
                    required: false
                }
            ],
            status: {
                enum: {
                    values: Object.keys(TasksStatus).map((v) => TasksStatus[v]),
                    message: 'Path `status` is invalid.'
                },
                required: true,
                default: TasksStatus.Pending,
                type: String
            }
        };

        const options: SchemaOptions = {
            timestamps: true
        };

        super(schema, options);

        this.pre('save', function (this: TasksInterfaceDocument, next: (err?: NativeError) => void) {
            if (Array.isArray(this.categories)) {
                this.categories = this.categories.map((c) => c.toLowerCase());
            }
            next();
        });
    }
}

export const Tasks = model<TasksInterfaceDocument, TasksModel>('Tasks', new TasksSchema());
