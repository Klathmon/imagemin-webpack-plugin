import { Options as GifsicleOptions } from 'imagemin-gifsicle';
import { Options as JpegTranOptions } from 'imagemin-jpegtran';
import { Options as OptiPngOptions } from 'imagemin-optipng';
import { Options as SvgoOptions } from 'imagemin-svgo';

import { Plugin } from 'webpack';

export default ImageminWebpackPugin;

declare class ImageminWebpackPugin extends Plugin {
  constructor(options: ImageminWebpackPugin.Options);
}

declare namespace ImageminWebpackPugin {
  type TestOption = RegExp | string | (() => boolean);

  // Generic options for plugins missing typings
  interface ExternalOptions {
    [key: string]: any;
  }

  interface Options {
    disable?: boolean;
    test?: TestOption | TestOption[];
    maxConcurrency?: number;
    optipng?: OptiPngOptions | null;
    gifsicle?: GifsicleOptions | null;
    jpegtran?: JpegTranOptions | null;
    svgo?: SvgoOptions | null;
    pngquant?: ExternalOptions | null;
    plugins?: Array<Promise<Buffer>> | [];
  }
}
