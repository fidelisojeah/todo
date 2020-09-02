export interface Serializer<T = unknown> {
    serializeInput?(data: unknown): Partial<T>;
    serializeOutput(data: Partial<T>): unknown;
}
