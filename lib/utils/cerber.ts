/// <reference path="../native.ts" />
/// <reference path="../object.ts" />

/* tslint:disable:no-var-requires */

const path = require("path");
const crypto2 = require("crypto");
const fs2 = require("fs");

const DEFAULT_IGNORE = ([
  ".DS_Store",
  ".git",
  ".gitignore",
  ".hg",
  ".lock-wscript",
  ".npmignore",
  ".npmrc",
  ".svn",
  ".yarnrc",
  "CVS",
  "config.gypi",
  "node_modules",
  "npm-debug.log",
  "cerber.lock",
  "cerber.lock.sig",
  "yarn-error.log",
  "yarn.lock",
]);

const DEFAULT_OUT_FILENAME = "cerber.lock";

namespace trusted.utils {
    /**
     * App for sign and verify node packages
     *
     * @export
     * @class Cerber
     * @extends {BaseObject<native.UTILS.Cerber>}
     */
    export class Cerber extends BaseObject<native.UTILS.Cerber> {
        /**
         * Sign package
         *
         * @static
         * @param {string} modulePath Directory path
         * @param {pki.Certificate} cert Signer certificate
         * @param {pki.Key} key Signer private key
         *
         * @memberOf Cerber
         */
        public static sign(modulePath: string, cert: pki.Certificate, key: pki.Key): void {
            const cerber = new Cerber();
            cerber.sign(modulePath, cert, key);
        }

        /**
         * Verify package
         *
         * @static
         * @param {string} modulePath Directory path
         * @param {pki.CertificateCollection} [cacerts] CA certificates
         * @returns {boolean}
         *
         * @memberOf Cerber
         */
        public static verify(modulePath: string, cacerts?: pki.CertificateCollection): boolean {
            const cerber = new Cerber();
            return cerber.verify(modulePath, cacerts);
        }

        /**
         * Creates an instance of Cerber.
         *
         *
         * @memberOf Cerber
         */
        constructor() {
            super();
        };

        /**
         * Sign package
         *
         * @param {string} modulePath Directory path
         * @param {pki.Certificate} cert Signer certificate
         * @param {pki.Key} key Signer private key
         *
         * @memberOf Cerber
         */
        public sign(modulePath: string, cert: pki.Certificate, key: pki.Key): void {
            const modules = this.rehash(modulePath);
            if (!modules.length) {
                throw new Error("Empty directory");
            }
            const cerberLockPath = path.join(modulePath, DEFAULT_OUT_FILENAME);

            let sd;
            let signer;
            let policies;

            let str = JSON.stringify(modules, null, 2);
            fs2.writeFileSync(cerberLockPath, str);

            sd = new trusted.cms.SignedData();
            sd.policies = ["detached"];
            signer = sd.createSigner(cert, key);

            sd.content = {
                data: cerberLockPath,
                type: trusted.cms.SignedDataContentType.url,
            };

            sd.sign();
            sd.save(cerberLockPath + ".sig", trusted.DataFormat.PEM);
        }

        /**
         * Verify package
         *
         * @param {string} modulePath Directory path
         * @param {pki.CertificateCollection} [cacerts] CA certificates
         * @returns {boolean}
         *
         * @memberOf Cerber
         */
        public verify(modulePath: string, cacerts?: pki.CertificateCollection): boolean {
            const cerberLockPath = path.join(modulePath, DEFAULT_OUT_FILENAME);
            const modules = this.rehash(modulePath);
            const buffer = fs2.readFileSync(cerberLockPath, "binary");
            const ccerber = JSON.parse(buffer);

            let cms;
            let policies;

            let certsD: pki.CertificateCollection = cacerts;
            if (!certsD) {
                certsD = new pki.CertificateCollection();
            }

            if (!(JSON.stringify(ccerber) === JSON.stringify(modules))) {
                return false;
            }

            cms = new trusted.cms.SignedData();
            cms.load(cerberLockPath + ".sig", trusted.DataFormat.PEM);

            if (cms.isDetached()) {
                cms.content = {
                    data: cerberLockPath,
                    type: trusted.cms.SignedDataContentType.url,

                };
            }

            return cms.verify(certsD);
        }

        /**
         * Get filenames and sha1 hashes
         *
         * @private
         * @param {string} dir Directory path
         * @param {string} [relative] Subdirectory
         * @returns {string[]} module_name#sha1_hash
         *
         * @memberOf Cerber
         */
        private rehash(dir: string, relative?: string): string[] {
            let modules = [];
            let filenames = fs2.readdirSync(dir);

            let filteredFiles = filenames.filter(function(e) {
                if (DEFAULT_IGNORE.indexOf(e) < 0) {
                    return true;
                }

                return false;
            });

            for (const name of filteredFiles) {
                const loc = path.join(dir, name);
                const stat = fs2.statSync(loc);
                let rel = relative ? path.join(relative, name) : name;

                if (stat.isDirectory()) {
                    modules = modules.concat(this.rehash(loc, rel));
                } else {
                    if (stat.isFile()) {
                        let buffer = fs2.readFileSync(loc, "binary");
                        let hash = crypto2.createHash("sha1").update(buffer).digest("hex");
                        modules.push(rel + "#" + hash);
                    }
                }
            }

            return modules;
        }
    }
}
