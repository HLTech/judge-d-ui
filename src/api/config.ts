/**
 * Return object which is a shallow merge of 'target' and 'source'. Written manually bacause:
 * - {...target, ...source} does not work with generic types (https://github.com/Microsoft/TypeScript/issues/22687)
 * - Object.assign does not work in IE <= 11
 */
function merge<T extends {}, U extends {}>(target: T, source: U): T & U {
    const newObj = Object.create(target);
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            newObj[key] = source[key];
        }
    }
    return newObj;
}

/**
 * Simple config class that allows to retrieve and overwrite application config set by environment in window.__config__
 */
export class AppConfig<T extends {}> {
    private config: T;
    public constructor() {
        // @ts-ignore
        this.config = window['__config__'] || {};
    }
    public get<K extends keyof T>(key: K): T[K] {
        return this.config[key];
    }
    public set(setConfig: Partial<T>): void {
        this.config = merge(this.config, setConfig);
    }
}

export const config = new AppConfig<{
    BASE_PATH: string;
}>();
