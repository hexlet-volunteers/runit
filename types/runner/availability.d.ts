export type Availability = {
    ok: true;
} | {
    ok: false;
    reason: 'no_cli' | 'no_daemon' | 'no_image' | 'disabled';
    message: string;
};
export declare function checkDaemon(): Promise<Availability>;
export declare function checkImage(language: string): Promise<Availability>;
