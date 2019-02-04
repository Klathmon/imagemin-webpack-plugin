import { Plugin } from 'webpack';

export default ImageminWebpackPugin;

declare class ImageminWebpackPugin extends Plugin {
  constructor(options: ImageminWebpackPugin.Options);
}

declare namespace ImageminWebpackPugin {
  type TestOption = RegExp | string | (() => boolean);

  // Keeping it as generic object as including all the other types would be too heavy
  interface ExternalOptions {
    [key: string]: any;
  }

  interface Options {
    disable?: boolean;
    test?: TestOption | TestOption[];
    maxConcurrency?: number;
    optipng?: ExternalOptions | null;
    gifsicle?: ExternalOptions | null;
    jpegtran?: ExternalOptions | null;
    svgo?: ExternalOptions | null;
    pngquant?: ExternalOptions | null;
    plugins?: Array<Promise<Buffer>> | [];
  }
}
