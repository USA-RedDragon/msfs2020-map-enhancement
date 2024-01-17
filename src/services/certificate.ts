import path from "path";
import fs from "fs";
import log from "electron-log";

import sudo from "sudo-prompt";
const options = {
  name: 'MSFS2020 Map Enhancement'
};

const CONF_DIR = path.join(__dirname, "../extra/nginx/conf")

export const addCertificate = (): Promise<void> => {
  log.info("Adding certificate if needed")
  return new Promise((resolve, reject) => {
    if (fs.existsSync(`${CONF_DIR}/key.pem`) && fs.existsSync(`${CONF_DIR}/cert.pem`)) {
      resolve();
    } else {
      sudo.exec(`"${CONF_DIR}/mkcert.exe" -install -key-file "${CONF_DIR}/key.pem" -cert-file "${CONF_DIR}/cert.pem" kh.ssl.ak.tiles.virtualearth.net khstorelive.azureedge.net *.virtualearth.net *.azureedge.net`, options,
        function(error: Error | undefined, stdout: string | Buffer | undefined, _stderr: string | Buffer | undefined) {
          if (error) {
            reject(error);
            return;
          }
          log.info("Added certificate", stdout);
          resolve();
        }
      );
    }
  })
};
