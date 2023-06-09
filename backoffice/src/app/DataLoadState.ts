class DataLoadState<T> {
    data?: T
    loading: boolean
    error?: { message?: string, detail?: string}
    constructor(data: T|undefined, loading: boolean, error?: { message?: string, detail?: string}) {
        this.data = data
        this.loading = loading
        this.error = error
    }
}

export function fromData<M> (data: M): DataLoadState<M> {
    return new DataLoadState(data, false, undefined)
}

export function beginOperation<M>(): DataLoadState<M> {
    return new DataLoadState<M>(undefined, true, undefined)
}

export function initial<M> (loading: boolean = true): DataLoadState<M> {
    return new DataLoadState<M>(undefined, loading, undefined)
}

export function fromError<M> (err: any, message: string): DataLoadState<M> {
    return new DataLoadState<M>(undefined, false, { message, detail: err.toString() })
}

export default DataLoadState