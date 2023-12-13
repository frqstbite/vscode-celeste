export type WindPattern =
    'None'       | 'Left'         | 'Right'         | 'Down'           |
    'Up'         | 'Space'        | 'LeftStong'     | 'RightStrong'    |
    'LeftOnOff'  | 'RightOnOff'   | 'LeftOnOffFast' | 'RightOnOffFast' |
    'RightCrazy' | 'LeftGemsOnly' | 'Alternating'   | string           ;

export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};