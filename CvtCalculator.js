/*
 * Copyright (c) 2023 Junhao Liao
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to
 *  deal in the Software without restriction, including without limitation the
 *  rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 *  sell copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 *  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 *  IN THE SOFTWARE.
 */

const DEFAULT_CVT_RB_VERSION = 'v2';

let CvtCalculatorInputs = {
  /*  Description:
          Version of the reduced blanking timing formula to be used.
      RB Timing Valid Values:
          v2: 2
          v3: 3
  */

  I_RED_BLANK_VER: {
    _value: 2, default: {
      v2: 2, v3: 3,
    },
    get value() {
      return this._value;
    },
    set value(v) {
      if (![2, 3].includes(v)) {
        throw `Invalid I_RED_BLANK_VER: ${v}`;
      }
      this._value = v;
    },
  },

  /*  Description:
          Desired active (visible) horizontal pixels per line (will be rounded
           to the nearest integer number of character cells).
      RB Timing Valid Values:
          Any positive integer
  */
  I_H_PIXELS: {
    _value: null, default: {},
    get value() {
      return this._value;
    },
    set value(v) {
      if (!Number.isInteger(v)) {
        throw `Invalid I_H_PIXELS: ${v}: Not an integer`;
      }
      if (v <= 0) {
        throw `Invalid I_H_PIXELS: ${v}: Less than 0 (inclusive)`;
      }
      this._value = v;
    },
  },

  /*  Description:
          Desired active (visible) vertical lines per frame.
      RB Timing Valid Values:
          Any positive integer
  */
  I_V_LINES: {
    _value: null, default: {},
    get value() {
      return this._value;
    },
    set value(v) {
      if (!Number.isInteger(v)) {
        throw `Invalid I_V_LINES: ${v}: Not an integer`;
      }
      if (v <= 0) {
        throw `Invalid I_V_LINES: ${v}: Less than 0 (inclusive)`;
      }
      this._value = v;
    },
  },

  /*  Description:
          Target vertical refresh rate.
      RB Timing Valid Values:
          Any positive real number
  */
  I_IP_FREQ_RQD: {
    _value: null, default: {},
    get value() {
      return this._value;
    },
    set value(v) {
      if (!Number.isFinite(v)) {
        throw `Invalid I_IP_FREQ_RQD: ${v}: Not a real number`;
      }
      if (v <= 0.0) {
        throw `Invalid I_IP_FREQ_RQD: ${v}: Less than 0.0 (inclusive)`;
      }
      this._value = v;
    },
  },

  /*  Description:
          Indicates whether to apply a 1,000/1,001 factor to the target vertical
           refresh rate to generate a “video-optimized” timing variant.
      RB Timing Valid Values:
          v2: "Y" or "N"
          v3: "N"
  */
  I_VIDEO_OPT: {
    _value: false, default: {
      v2: false, // or true
      v3: false,
    },
    get value() {
      return this._value;
    },
    set value(v) {
      if (typeof v != 'boolean') {
        throw `Invalid I_VIDEO_OPT: ${v}`;
      }
      this._value = v;
    },
  },

  /*  Description:
          Desired additional number of pixels to add to the base HBlank duration.
      RB Timing Valid Values:
          v2: 0
          v3: 0 or any integer multiple of 8 between 8 and 120, inclusive
  */
  I_ADDITIONAL_HBLANK: {
    value: 0, default: {
      v2: 0, v3: 0, // or any integer multiple of 8 between 8 and 120, inclusive
    },
  },

  /*  Description:
          Desired VBlank time (in us).
      RB Timing Valid Values:
          v2: 460
          v3: 460 or greater
  */
  I_VBLANK: {
    value: 460, default: {
      v2: 460, v3: 460, // or greater
    },
  },

  /*  Description:
          Indicates whether the VSync location is early (near the middle of the
           VBlank period) –or– late (near the end of the VBlank period).
      RB Timing Valid Values:
          v2: "N"
          v3: "Y" or "N"
  */
  I_EARLY_VSYNC_RQD: {
    value: false, default: {
      v2: false, v3: false, // or true
    },
  },
};

const CvtCalculatorConstants = {
  v2: {
    /*  Description:
            Pixel clock precision.
        Values:
            v2: 0.001
            v3: 0.001
    */
    C_CLOCK_STEP: 0.001,

    /*  Description:
            Character cell width.
        Values:
            v2: 1
            v3: 8
    */
    C_CELL_GRAN_RND: 1,

    /*  Description:
            Number of pixels in the horizontal front porch period.
        Values:
            v2: 8
            v3: 8
    */
    C_H_FRONT_PORCH: 8,

    /*  Description:
            Minimum HBlank duration (in pixels) for RB timings. Measured as the
             number of pixels between the last active (visible) pixel of one
             line and the first active (visible) pixel of the next line.
        Values:
            v2: 80
            v3: 80
    */
    C_RB_H_BLANK: 80,

    /*  Description:
            HSync duration (in pixels) for RB timings.
        Values:
            v2: 32
            v3: 32
    */
    C_RB_H_SYNC: 32,

    /*  Description:
            Minimum VBlank period (in us) for RB timings. Measured as the number
             of lines between the last line of active (visible) video of one
             frame and the first line of active (visible) video of the next
             frame.
        Values:
            v2: 460
            v3: 460
    */
    C_RB_MIN_V_BLANK: 460,

    /*  Description:
            Minimum vertical front porch duration (in lines).
        Values:
          v2: 1
          v3: 1
    */
    C_RB_V_FPORCH: 1,

    /*  Description:
          VSync duration (in lines).
      Values:
          v2: 8
          v3: 8
    */
    C_V_SYNC_RND: 8,

    /*  Description:
            Minimum vertical back porch.
        Values:
            v2: 6
            v3: 6
    */
    C_MIN_V_BPORCH: 6,

    /*  Description:
            Additional ppm offset adjustment to be added to the requested
             refresh rate.
        Values:
            v2: 0
            v3: +350 ppm
    */
    C_V_FIELD_RATE_PPM_ADJ: 0,
  }, v3: {
    C_CLOCK_STEP: 0.001,
    C_CELL_GRAN_RND: 8,
    C_H_FRONT_PORCH: 8,
    C_RB_H_BLANK: 80,
    C_RB_H_SYNC: 32,
    C_RB_MIN_V_BLANK: 460,
    C_RB_V_FPORCH: 1,
    C_V_SYNC_RND: 8,
    C_MIN_V_BPORCH: 6,
    C_V_FIELD_RATE_PPM_ADJ: 350,
  },
};

let CvtCalculatorVariables = {
  /*  Description:
          Actual horizontal frequency.
  */
  ACT_H_FREQ: null,

  /*  Description:
          Actual total VBlank time (in us).
  */
  ACT_V_BLANK_TIME: null,

  /*  Description:
          Number of VBlank lines required to meet the minimum VBlank period.
  */
  VBI_LINES: null,

  /*  Description:
          Actual number of VBlank lines in the VBlank period (VBI_LINES is
           adjusted to ensure that it is more than the minimum number of lines
           required).
  */
  V_BLANK: null,

  /*  Description:
          Used as an intermediary variable to estimate the horizontal period so
           that critical parameters such as the required pixel clock frequency,
           VBlank interval, etc., can be determined.
  */
  H_PERIOD_EST: null,

  /*  Description:
          Minimum allowable VBlank Interval (in lines).
  */
  RB_MIN_VBI: null,

  /*  Description:
          Refresh rate multiplier factor. For RB Timing v2, the factor is set to
           1,000/1,001 if a video-optimized refresh rate is requested. In all
           other cases, the factor is set to 1.
  */
  REFRESH_MULTIPLIER: null,

  /*  Description:
          Total number of pixel clock cycles per horizontal line.
  */
  TOTAL_PIXELS: null,

  /*  Description:
          Total number of vertical lines per field. For interlaced timing, this
           value has a half line added. For progressive scan timing, the value
           is always an integer.
  */
  TOTAL_V_LINES: null,

  /*  Description:
          Specifies the required vertical field rate. This value represents the
           target vertical refresh rate adjusted by the required ppm offset.
  */
  V_FIELD_RATE_RQD: null,

  /*  Description:
          Pixel clock frequency.
  */
  ACT_PIXEL_FREQ: null,

  /*  Description:
          Total number of active (visible) pixels per line.
  */
  TOTAL_ACTIVE_PIXELS: null,

  /*  Description:
          Total number of active (visible) vertical lines per frame.
  */
  V_LINES_RND: null,

  /*  Description:
          Number of pixels in the horizontal front porch period.
  */
  C_H_FRONT_PORCH: null,

  /*  Description:
          Number of pixels in the HSync period.
  */
  C_RB_H_SYNC: null,

  /*  Description:
          Number of pixels in the horizontal back porch period.
  */
  H_BACK_PORCH: null,

  /*  Description:
          Number of lines in the vertical front porch period.
  */
  V_FRONT_PORCH: null,

  /*  Description:
          Number of lines in the VSync period.
  */
  C_V_SYNC_RND: null,

  /*  Description:
          Number of lines in the vertical back porch period.
  */
  V_BACK_PORCH: null,

  /*  Description:
          Frame rate.
  */
  ACT_FRAME_RATE: null,
};

const calculate = (cvtRbVersion, input) => {
  const constants = CvtCalculatorConstants[cvtRbVersion];
  let variables = JSON.parse(JSON.stringify(CvtCalculatorVariables));

  /*
   1. Calculate the required field refresh rate (Hz):
         V_FIELD_RATE_RQD = I_IP_FREQ_RQD * (1 + C_V_FIELD_RATE_PPM_ADJ /
         1000000)
  */
  variables.V_FIELD_RATE_RQD = input.I_IP_FREQ_RQD.value *
      (1 + constants.C_V_FIELD_RATE_PPM_ADJ / 1000000);

  /*
   2. Round the desired number of horizontal pixels down to the nearest character cell boundary:
         TOTAL_ACTIVE_PIXELS = ROUNDDOWN(I_H_PIXELS / C_CELL_GRAN_RND, 0) *
         C_CELL_GRAN_RND
  */
  variables.TOTAL_ACTIVE_PIXELS = Math.floor(
          input.I_H_PIXELS.value / constants.C_CELL_GRAN_RND) *
      constants.C_CELL_GRAN_RND;

  /*
   3. Round the number of vertical lines down to the nearest integer:
         V_LINES_RND = ROUNDDOWN(I_V_LINES, 0)
  */
  variables.V_LINES_RND = Math.floor(input.I_V_LINES.value);

  /*
   4. Calculate the estimated Horizontal Period (kHz):
         H_PERIOD_EST = ((1000000 / (V_FIELD_RATE_RQD)) – C_RB_MIN_V_BLANK) /
         V_LINES_RND
  */
  variables.H_PERIOD_EST = ((1000000 / variables.V_FIELD_RATE_RQD) -
      constants.C_RB_MIN_V_BLANK) / variables.V_LINES_RND;

  /*
   5. Calculate the total VBlank time:
         ACT_V_BLANK_TIME = IF(I_VBLANK < C_RB_MIN_V_BLANK,
         C_RB_MIN_V_BLANK, I_VBLANK)
  */
  if (input.V_BLANK < constants.C_RB_MIN_V_BLANK) {
    variables.ACT_V_BLANK_TIME = constants.C_RB_MIN_V_BLANK;
  } else {
    variables.ACT_V_BLANK_TIME = input.I_VBLANK.value;
  }

  /*
   6. Calculate the number of idealized lines in the VBlank interval:
         VBI_LINES = ROUNDUP(ACT_V_BLANK_TIME / H_PERIOD_EST, 0)
  */
  variables.VBI_LINES = Math.ceil(
      variables.ACT_V_BLANK_TIME / variables.H_PERIOD_EST);

  /*
   7. Determine whether idealized VBlank is sufficient and calculate the actual
    number of lines in the VBlank period:
         RB_MIN_VBI = C_RB_V_FPORCH + C_V_SYNC_RND + C_MIN_V_BPORCH
         V_BLANK = IF(VBI_LINES < RB_MIN_VBI, RB_MIN_VBI, VBI_LINES)
  */
  variables.RB_MIN_VBI = constants.C_RB_V_FPORCH + constants.C_V_SYNC_RND +
      constants.C_MIN_V_BPORCH;
  if (variables.VBI_LINES < variables.RB_MIN_VBI) {
    variables.V_BLANK = variables.RB_MIN_VBI;
  } else {
    variables.V_BLANK = variables.VBI_LINES;
  }

  /*
   8. Calculate the total number of vertical lines:
         TOTAL_V_LINES = V_BLANK + V_LINES_RND
  */
  variables.TOTAL_V_LINES = variables.V_BLANK + variables.V_LINES_RND;
  /*
   9. Calculate the vertical back porch:
         V_BACK_PORCH = IF(AND(I_RED_BLANK_VER=3, I_EARLY_VSYNC_RQD?="Y"),
         ROUNDDOWN(VBI_LINES / 2, 0), C_MIN_V_BPORCH)
  */
  if ((cvtRbVersion === 'v3') && (input.I_EARLY_VSYNC_RQD.value)) {
    variables.V_BACK_PORCH = Math.floor(variables.VBI_LINES / 2);
  } else {
    variables.V_BACK_PORCH = constants.C_MIN_V_BPORCH;
  }

  /*
   10. Calculate the vertical front porch:
         V_FRONT_PORCH = V_BLANK – V_BACK_PORCH – C_V_SYNC_RND
  */
  variables.V_FRONT_PORCH = variables.V_BLANK - variables.V_BACK_PORCH -
      constants.C_V_SYNC_RND;

  /*
   11. Calculate the total number of pixels per line:
         TOTAL_PIXELS = TOTAL_ACTIVE_PIXELS + C_RB_H_BLANK +
         IF(I_RED_BLANK_VER=3, I_ADDITIONAL_HBLANK, 0)
  */
  variables.TOTAL_PIXELS = variables.TOTAL_ACTIVE_PIXELS +
      constants.C_RB_H_BLANK +
      ((cvtRbVersion === 'v3') ? input.I_ADDITIONAL_HBLANK.value : 0);

  /*
   12. Calculate the horizontal back porch:
         H_BACK_PORCH = C_RB_H_BLANK + IF(I_RED_BLANK_VER=3,
         I_ADDITIONAL_HBLANK, 0) – C_H_FRONT_PORCH – C_RB_H_SYNC
  */
  variables.H_BACK_PORCH = constants.C_RB_H_BLANK +
      ((cvtRbVersion === 'v3') ? input.I_ADDITIONAL_HBLANK.value : 0) -
      constants.C_H_FRONT_PORCH - constants.C_RB_H_SYNC;

  /*
   13. Calculate the pixel clock frequency to the nearest C_CLOCK_STEP (MHz):
         REFRESH_MULTIPLIER = IF(AND(I_RED_BLANK_VER=2, I_VIDEO_OPT?="Y"),
         1000/1001, 1)
         ACT_PIXEL_FREQ = C_CLOCK_STEP * IF(I_RED_BLANK_VER=2,
         ROUNDDOWN((V_FIELD_RATE_RQD * TOTAL_V_LINES * TOTAL_PIXELS /
         1000000 * REFRESH_MULTIPLIER) / C_CLOCK_STEP, 0),
         ROUNDUP((V_FIELD_RATE_RQD * TOTAL_V_LINES * TOTAL_PIXELS /
         1000000 * REFRESH_MULTIPLIER) / C_CLOCK_STEP, 0))
  */
  if ((cvtRbVersion === 'v2') && (input.I_VIDEO_OPT.value)) {
    variables.REFRESH_MULTIPLIER = 1000 / 1001;
  } else {
    variables.REFRESH_MULTIPLIER = 1;
  }

  if (cvtRbVersion === 'v2') {
    variables.ACT_PIXEL_FREQ = constants.C_CLOCK_STEP * Math.floor(
        (variables.V_FIELD_RATE_RQD * variables.TOTAL_V_LINES *
            variables.TOTAL_PIXELS /
            1000000 * variables.REFRESH_MULTIPLIER) / constants.C_CLOCK_STEP);
  } else {
    variables.ACT_PIXEL_FREQ = constants.C_CLOCK_STEP * Math.ceil(
        (variables.V_FIELD_RATE_RQD * variables.TOTAL_V_LINES *
            variables.TOTAL_PIXELS /
            1000000 * variables.REFRESH_MULTIPLIER) / constants.C_CLOCK_STEP);
  }

  /*
   14. Find actual Horizontal Frequency (kHz):
         ACT_H_FREQ = 1000 * ACT_PIXEL_FREQ / TOTAL_PIXELS
  */
  variables.ACT_H_FREQ = 1000 * variables.ACT_PIXEL_FREQ /
      variables.TOTAL_PIXELS;

  /*
   15. Find actual Vertical Refresh Rate (Hz):
         ACT_FRAME_RATE = 1000 * ACT_H_FREQ / TOTAL_V_LINES
  */
  variables.ACT_FRAME_RATE = 1000 * variables.ACT_H_FREQ /
      variables.TOTAL_V_LINES;

  for (let key in variables) {
    if (variables[key] === null) {
      variables[key] = constants[key];
    }
  }

  return variables;
};

let input = structuredClone(CvtCalculatorInputs);
input.I_H_PIXELS.value = 1920;
input.I_V_LINES.value = 1080;
input.I_IP_FREQ_RQD.value = 60;
console.log(CvtCalculatorInputs);
console.log(CvtCalculatorConstants);
console.log(CvtCalculatorVariables);
console.log(calculate(DEFAULT_CVT_RB_VERSION, input));
console.log(calculate('v2', input));

