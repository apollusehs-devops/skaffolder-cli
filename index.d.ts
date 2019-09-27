import { SkaffolderObject } from "../../src/models/skaffolderObject";

export as namespace SkaffolderCli;

export function getUser(): string | undefined;
export function login(
  args: any,
  options: any,
  logger: { info: (message: string) => any },
  cb: any
): any;

export function exportProject(
  params: {
    project: string;
    generator: string;
    skObject: any;
  },
  cb: any
): void;
export function registerHelpers(Handlebar: any): void;
export function getGenFiles(path: string): GeneratorFile[];
export function getTemplate(callback: any): any;
export function generate(
  workspacePath: string,
  data: any,
  logger: { info: (message: string) => any },
  callback: (err: string[], log: string[]) => any
): any;
export function generateFile(log: any,file: {
  name: string,
  overwrite: boolean,
  template: any
}, paramLoop: any, opt: any): any;
export function init(workspacePath: string, project: any, modules: any, resources: any, db: any): any;
export function createProjectExtension(workspacePath: string, projectId: string, 
  logger: { info: (message: string) => any
}, frontendId: string, backendId: string, skaffolderObj: any, callback: (files: any) => any): any;
export function getProperties(content: any, nameFileTemplate: any, pathTemplate: any): any;


export class GeneratorFile {
  public name: string;
  public forEachObj: string;
  public overwrite: boolean;
  public template: string;
  public _partials: PartialFile[];
}

export class PartialFile {
  public name: string;
  public tagFrom: string;
  public tagTo: string;
  public template: string;
}
