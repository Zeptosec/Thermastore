import { useState, useRef, ChangeEvent } from "react";
import axios from 'axios';

const uploadPage = () => {

    const [uploadFiles, setUploadFiles] = useState<Array<File>>([]);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploaded, setUploaded] = useState<Array<File>>([]);
    const [uploadIndex, setUploadIndex] = useState<number>(0);
    function filesChanged(vnt: ChangeEvent<HTMLInputElement>) {
        const files = vnt.target.files;
        if (files == null) return;
        let tmpFiles: Array<File> = [];
        for (let i = 0; i < files.length; i++) {
            const ind = uploadFiles.findIndex(w => w.name === files[i].name);
            if (ind === -1) {
                tmpFiles.push(files[i]);
            }
        }
        setUploadFiles(w => [...w, ...tmpFiles]);
        vnt.target.value = "";
    }

    const chunkSize = 8 * 1024 ** 2;
    async function upload() {
        if (uploadFiles.length === 0 || uploading) return;
        setUploading(true);
        let i = uploadIndex;
        while (uploadFiles.length > i) {
            const fil = uploadFiles[i];
            if (uploaded.findIndex(w => w.name === fil.name) !== -1) {
                console.log("found");
                i++;
                setUploadIndex(w => w + 1);
                setUploadFiles(w => w.slice(1));
                continue;
            }
            let start = 0;
            let nd = Math.min(chunkSize, fil.size);

            while (start !== fil.size) {
                let blob = fil.slice(start, nd);
                let formdata = new FormData();
                formdata.set('file', blob);
                try {
                    const rs = await axios.post('http://localhost:4000/api/upload', formdata, {
                        onUploadProgress: w => {
                            console.log(`${fil.name} - ${start} - ${nd} - ${w.loaded}`);
                        }
                    });
                    console.log(rs.data);
                    start = nd;
                    nd = Math.min(fil.size, nd + chunkSize);
                    i++;
                    setUploadIndex(w => w + 1);
                    setUploadFiles(w => w.slice(1));
                    setUploaded(w => [...w, fil]);
                } catch (rr) {
                    console.log(rr);
                }
            }
        }
        setUploading(false);
    }

    return (
        <div>
            <input onChange={w => filesChanged(w)} type="file" multiple name="files" id="files" />

            {uploadFiles.length > 0 ? <>
                <table>
                    <thead>
                        <tr>
                            <th>name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uploadFiles.map((w, ind) => {
                            console.log(w);
                            console.log(uploadFiles)
                            return (
                                <tr key={ind}>
                                    <td>{w.name}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                <button disabled={uploading} onClick={upload}>Upload</button>
            </>
                : ""}
        </div>
    )
}

export default uploadPage;