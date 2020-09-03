import { UserInterface, UserDocument } from '+models/Users';
import { Serializer } from '+interfaces/Serializer';
import { titleCase } from '+utils';

export class UsersSerializer implements Serializer<{ data: UserInterface; token?: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public serializeInput(data: any, newUser = false): Partial<UserInterface> {
        return {
            email: data.email,
            profile: this.serializeProfileInput(data.profile),
            ...(newUser && { password: data.password })
        };
    }

    public serializeOutput({ data, token }: { data: UserDocument; token?: string }): object {
        return {
            id: data._id.toString(),
            email: data.email,
            picture: data.gravatar(),
            ...this.serializeProfileOutput(data.profile),
            ...(token && { token })
        };
    }

    private serializeProfileOutput(profile: UserDocument['profile']): object {
        return {
            name: titleCase(profile.name),
            gender: titleCase(profile.gender),
            timezone: profile.timezone
        };
    }

    private serializeProfileInput(profile: UserInterface['profile']): UserInterface['profile'] | undefined {
        if (!profile) return undefined;

        return {
            name: profile.name,
            timezone: profile.timezone,
            gender: profile.gender
        };
    }
}

export default new UsersSerializer();
