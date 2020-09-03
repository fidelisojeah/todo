import { Document, Schema, SchemaDefinition, SchemaOptions, NativeError, model } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import mongooseUniqueValidator from 'mongoose-unique-validator';
import { tz } from 'moment-timezone';
import isEmail from 'validator/lib/isEmail';

export interface UserInterface {
    email: string;
    password: string;

    profile: {
        name: string;
        gender: string;
        timezone: string;
    };
}

export type UserDocument = UserInterface &
    Document & {
        comparePassword: (candidatePassword: string) => Promise<boolean>;
        gravatar: (size?: number) => string;
    };

class UserSchema extends Schema {
    constructor() {
        const schema: SchemaDefinition = {
            email: {
                type: String,
                required: true,
                unique: true,
                trim: true,
                lowercase: true,
                validate: {
                    validator: function (value: string) {
                        return isEmail(value);
                    },
                    message: 'Path `email` is invalid.'
                }
            },
            password: {
                type: String,
                required: true
            },
            profile: {
                name: {
                    type: String,
                    required: true
                },
                gender: {
                    type: String,
                    required: true,
                    lowercase: true
                },
                timezone: {
                    type: String,
                    required: true,
                    validate: {
                        validator: function (value: string) {
                            return !!tz.zone(value);
                        },
                        message: 'Path `profile.timezone` is invalid.'
                    }
                }
            }
        };

        const options: SchemaOptions = {
            timestamps: true
        };

        super(schema, options);
        this.plugin(mongooseUniqueValidator, { message: 'Path `{PATH}` must be unique.' });

        this.methods = {
            async comparePassword(this: UserDocument, candidatePassword: string) {
                const match = await bcrypt.compare(candidatePassword, this.password);
                return match;
            },
            gravatar(size: number = 200) {
                if (!this.email) {
                    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
                }

                const md5 = crypto.createHash('md5').update(this.email).digest('hex');
                return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
            }
        };

        this.pre('save', async function (this: UserDocument, next: (err?: NativeError) => void) {
            if (this.isModified('password')) {
                try {
                    const salt = await bcrypt.genSalt(10);
                    const hash = await bcrypt.hash(this.password, salt);
                    this.password = hash;
                } catch (error) {
                    next(error);
                }
            }
            next();
        });
    }
}

export const Users = model<UserDocument>('Users', new UserSchema());
