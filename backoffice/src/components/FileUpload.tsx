const FileUpload = () => {
    return <input accept="image/*" id="upl" multiple type="file" onChange={(e) => {
        e.currentTarget.files
    }} />
}

export default FileUpload