import moment from 'moment-timezone';
import { TasksInterface, TasksInterfaceDocument } from '+models/Tasks';
import { Serializer } from '+interfaces/Serializer';
import { titleCase } from '+utils';

export class TasksSerializer implements Serializer<TasksInterfaceDocument> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public serializeInput(data: any): Omit<TasksInterface, 'createdAt' | 'updatedAt'> {
        return {
            title: data.title,
            description: data.description,
            due: data.due,
            categories: this.serializeCategoriesInput(data.categories),
            status: data.status ? data.status.toLowerCase() : undefined
        };
    }

    public serializeOutput(data: Partial<TasksInterfaceDocument>): object {
        return {
            id: data._id.toString(),
            title: data.title,
            description: data.description,
            due: data.due,
            dueDescription: moment(data.due).fromNow(),
            categories: this.serializeCategoriesOutput(data.categories),
            status: data.status ? titleCase(data.status) : undefined
        };
    }

    private serializeCategoriesOutput(categories: string[] | undefined): string[] {
        if (!categories) return [];
        return categories.map((category) => titleCase(category));
    }

    private serializeCategoriesInput(categories: string[] | undefined): string[] | undefined {
        if (!categories) return undefined;
        return categories.map((category) => category.toLowerCase());
    }
}

export default new TasksSerializer();
