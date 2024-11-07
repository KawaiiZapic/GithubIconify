/**
 * vite-plugin-zip-pack@1.2.1(https://github.com/7th-Cyborg/vite-plugin-zip-pack)
 * Original project does not support ESM, so this plugin must be included in project source.
 * 
 * MIT License
 * 
 * Copyright (c) 2024 Darko Ceranac
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */

import { PluginOption } from "vite";
import fs from "fs";
import path from "path";
import JSZip from "jszip";

function timeZoneOffset(date: Date): Date {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

export interface Options {
  /**
   * Input Directory
   * @default `dist`
   */
  inDir?: string;
  /**
   * Output Directory
   * @default `dist-zip`
   */
  outDir?: string;
  /**
   * Zip Archive Name
   * @default `dist.zip`
   */
  outFileName?: string;
  /**
   * Path prefix for the files included in the zip file
   * @default ``
   */
  pathPrefix?: string;
  /**
   * Callback, which is executed after the zip file was created
   * err is only defined if the save function fails
   */
  done?: (err: Error | undefined) => void
   /**
   * Filter function equivalent to Array.prototype.filter 
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
   * is executed for every files and directories
   * files and directories are only included when return ist true.
   * All files are included when function is not defined
   */
  filter?: (fileName: string, filePath: string, isDirectory: boolean) => Boolean
}

export default function zipPack(options?: Options): PluginOption {
  const inDir = options?.inDir || "dist";
  const outDir = options?.outDir || "dist-zip";
  const outFileName = options?.outFileName || "dist.zip";
  const pathPrefix = options?.pathPrefix || '';
  const done = options?.done || function (){};
  const filter = options?.filter || (() => true );

  async function addFilesToZipArchive(zip: JSZip, inDir: string) {
    const listOfFiles = await fs.promises.readdir(inDir);

    for (const fileName of listOfFiles) {
      const filePath = path.join(inDir, fileName);
      const file = await fs.promises.stat(filePath);
      const timeZoneOffsetDate = timeZoneOffset(new Date(file.mtime));

      if (file.isDirectory()) {
        if(!filter(fileName, filePath, true)) {
          continue;
        }
        zip.file(fileName, null, {
          dir: true,
          date: timeZoneOffsetDate
        });
        const dir = zip.folder(fileName);
        if(!dir) {
          throw new Error(`fileName '${fileName}' couldn't get included als directory in the zip`);
        }

        await addFilesToZipArchive(dir, filePath);
      } else {
        if(filter(fileName, filePath, false)) {
          zip.file( 
            fileName, 
            await fs.promises.readFile(filePath), 
            { date: timeZoneOffsetDate }
          );
        }
      }
    }
  }

  async function createZipArchive(zip: JSZip) {
    // @ts-ignore
    zip.root = '';

    const file = await zip
      .generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: {
          level: 9,
        },
      })
      
    const fileName = path.join(outDir, outFileName);

    if (fs.existsSync(fileName)) {
      await fs.promises.unlink(fileName);
    }

    await fs.promises.writeFile(fileName, file)
    done(undefined)
  }

  return {
    name: "vite-plugin-zip-pack",
    apply: "build",
    enforce: "post",
    async closeBundle() {
      try {
        console.log("\x1b[36m%s\x1b[0m", `Zip packing - "${inDir}" folder :`);
        
        if (!fs.existsSync(inDir)) {
          throw new Error(` - "${inDir}" folder does not exist!`)
        }

        if (!fs.existsSync(outDir)) {
          await fs.promises.mkdir(outDir, { recursive: true });
        }

        if (pathPrefix && path.isAbsolute(pathPrefix)) {
          throw new Error('"pathPrefix" must be a relative path');
        }

        const zip = new JSZip();
        let archive: JSZip;

        if (pathPrefix) {
          const timeZoneOffsetDate = timeZoneOffset(new Date());

          zip.file(pathPrefix, null, {
            dir: true,
            date: timeZoneOffsetDate
          });
          const zipFolder = zip.folder(pathPrefix);
          
          if(!zipFolder) 
            throw new Error("Files could not be loaded from 'pathPrefix'")

          archive = zipFolder!
        } else {
          archive = zip;
        }

        console.log("\x1b[32m%s\x1b[0m", "  - Preparing files.");
        await addFilesToZipArchive(archive, inDir);

        console.log("\x1b[32m%s\x1b[0m", "  - Creating zip archive.");
        await createZipArchive(archive)

        console.log("\x1b[32m%s\x1b[0m", "  - Done.");
      } catch (error: any) {
        if (error) {
          console.log(
            "\x1b[31m%s\x1b[0m",
            `  - ${error}`
          );
        }

        console.log(
          "\x1b[31m%s\x1b[0m",
          "  - Something went wrong while building zip file!"
        );
        done(error)
      }
    }
  };
}