import fs from "fs/promises"; //Node file system
import path from "path";

async function addRepo(filePath) {
    const repoPath = path.resolve(process.cwd(), ".apnaGit");
    const stagingPath = path.join(repoPath, "staging");
    try {
        console.log("yes");
        await fs.mkdir(stagingPath, {recursive:true});
        const fileName = path.basename(filePath);
        await fs.copyFile(filePath, path.join(stagingPath, fileName));
        console.log(`File ${fileName} added to staging area!`);

    } catch (error) {
        console.error("Error adding file", error);
    }
}

export {addRepo};