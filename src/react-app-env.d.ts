/// <reference types="react-scripts" />

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}

declare module "*.jpeg";
declare module "*.jpg";
declare module "*.gif";
declare module "*.bmp";
declare module "*.tiff";
declare module "*.css";
declare module "*.module.css";
declare module "*.scss";
declare module "*.module.scss";