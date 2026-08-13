import { useState } from "react";
import { FileTrigger } from 'react-aria-components/FileTrigger';
import { Button } from "./Button";
export default function FileInput(props: any) {
	let [files, setFiles] = useState<string[]>([]);

  return (
    <>
      <FileTrigger
        {...props}
        acceptedFileTypes={["image/*"]}
        onSelect={(e) => {
          let files = e ? Array.from(e) : [];
          let filenames = files.map((file) => file.name);
          setFiles(filenames);
        }}>
        <Button>Select a file</Button>
      </FileTrigger>
      <span className="ml-2">{files.join(', ')}</span>
    </>
  );
}
