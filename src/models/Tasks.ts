import { Document, Model, model, Schema, SchemaDefinition, SchemaOptions } from 'mongoose';
import { TasksStatus } from '+interfaces/enums';
import { Users } from './Users';

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
                    required: false,
                    lowercase: true
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
            },
            userId: {
                type: Schema.Types.ObjectId,
                required: true,
                validate: {
                    validator: async function (value: Schema.Types.ObjectId) {
                        const user = await Users.findById(value);

                        if (!user) {
                            return false;
                        }
                        return true;
                    },
                    message: 'User does not exist'
                }
            }
        };

        const options: SchemaOptions = {
            timestamps: true
        };

        super(schema, options);
    }
}

export const Tasks = model<TasksInterfaceDocument, TasksModel>('Tasks', new TasksSchema());
