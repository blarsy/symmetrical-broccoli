class DataLoadState {
    data: any
    loading: boolean
    error: { message?: string, detail?: string}
    constructor(data: any, loading: boolean, error: { message?: string, detail?: string}) {
        this.data = data
        this.loading = loading
        this.error = error
    }
}

export const fromData = (data: any): DataLoadState => {
    return new DataLoadState(data, false, {})
}

export const initial = (): DataLoadState => {
    return new DataLoadState({}, true, {})
}

export const fromError = (err: any, message: string) => {
    return new DataLoadState({}, false, { message, detail: err.toString() })
}

export default DataLoadState