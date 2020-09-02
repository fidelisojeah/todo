import * as express from 'express';
import { TasksSerializer } from '+serializer';
import { Tasks } from '+models/Tasks';
import { CREATED, OK } from 'http-status-codes';
import { EntityNotFoundException, QueryValidationError } from '+core/exceptions';
import { MongooseQueryParser } from 'mongoose-query-parser';

export class TasksController {
    public router = express.Router({ mergeParams: true });
    mongooseQueryParser: MongooseQueryParser;
    constructor() {
        require('express-async-errors');
        this.mongooseQueryParser = new MongooseQueryParser();

        this.router.get('/', this.getTasks);
        this.router.post('/', this.createTask);
        this.router.get('/:id', this.getTask);
        this.router.put('/:id', this.updateTask);
        this.router.patch('/:id', this.updateTask);
        this.router.delete('/:id', this.deleteTask);
    }

    private getTasks = async (request: express.Request, response: express.Response) => {
        const validQueryProperties = [
            'id',
            'title',
            'due',
            'categories',
            'status',
            'createdAt',
            'updatedAt',
            'description',
            '$and',
            '$or'
        ];
        const { filter, sort } = this.mongooseQueryParser.parse(request.query);

        const filterErrors = {
            ...this.validateQuery('filter', filter, validQueryProperties),
            ...this.validateQuery('sort', sort, validQueryProperties)
        };
        if (Object.keys(filterErrors).length > 0) {
            throw new QueryValidationError(filterErrors);
        }

        const data = await Tasks.find(filter)
            .sort({ due: -1, createdAt: -1, ...sort }) // add some defaultt sorting, would be excluded later
            .exec();

        response.responseModule(
            {
                data,
                status: OK
            },
            TasksSerializer
        );
    };

    private validateQuery = (type: string, values: object, validQueryProperties: string[]) => {
        if (!values) {
            return {};
        }
        const errors = Object.keys(values).reduce((result, currentValue: string) => {
            if (validQueryProperties.indexOf(currentValue) === -1) {
                result[currentValue] = [`${currentValue} is not a valid ${type}.`];
            }
            return result;
        }, {});

        return errors;
    };

    private async createTask(request: express.Request, response: express.Response) {
        const input = TasksSerializer.serializeInput(request.body);

        const data = await new Tasks(input).save();

        response.responseModule(
            {
                data,
                message: 'Task Created Successfully',
                status: CREATED
            },
            TasksSerializer
        );
    }

    private async updateTask(request: express.Request, response: express.Response) {
        const task = await Tasks.findById(request.params.id);

        if (!task) {
            throw new EntityNotFoundException('Task does not exist', request);
        }

        const input = TasksSerializer.serializeInput(request.body);

        const data = await Tasks.findByIdAndUpdate(task._id, input, {
            omitUndefined: request.method === 'PATCH',
            new: true,
            runValidators: true
        });

        response.responseModule(
            {
                data,
                message: 'Task Updated Successfully',
                status: OK
            },
            TasksSerializer
        );
    }

    private async getTask(request: express.Request, response: express.Response) {
        const task = await Tasks.findById(request.params.id);

        if (!task) {
            throw new EntityNotFoundException('Task does not exist', request);
        }

        response.responseModule(
            {
                data: task,
                status: OK
            },
            TasksSerializer
        );
    }

    private async deleteTask(request: express.Request, response: express.Response) {
        const task = await Tasks.findById(request.params.id);

        if (!task) {
            throw new EntityNotFoundException('Task does not exist', request);
        }

        task.deleteOne();

        response.responseModule({
            data: {},
            message: 'Task Deleted Successfully.',
            status: OK
        });
    }
}

export default new TasksController().router;
