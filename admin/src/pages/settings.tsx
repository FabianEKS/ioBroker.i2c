import * as React from 'react';

import { ReactNode } from 'react';

import { CheckboxLabel } from '../components/checkbox-label';
import { OnSettingsChangedCallback } from '../lib/common';
import { I2CAdapterConfig } from '../../../src/lib/shared';

interface SettingsProps {
    onChange: OnSettingsChangedCallback;
    settings: I2CAdapterConfig;
}

interface SettingsState {
    [key: string]: unknown;
    serialport?: string;
    writeLogFile?: boolean;
    _serialports?: string[];
    networkKey?: string;
}

export class Settings extends React.Component<SettingsProps, SettingsState> {
    constructor(props: SettingsProps) {
        super(props);
        // settings are our state
        this.state = {
            ...props.settings,
        };

        // setup change handlers
        this.handleChange = this.handleChange.bind(this);
    }

    private chkWriteLogFile: HTMLInputElement | null | undefined;

    private parseChangedSetting(target: HTMLInputElement | HTMLSelectElement): unknown {
        // Checkboxes in MaterializeCSS are messed up, so we attach our own handler
        // However that one gets called before the underlying checkbox is actually updated,
        // so we need to invert the checked value here
        return target.type === 'checkbox'
            ? !(target as any).checked
            : target.type === 'number'
            ? parseInt(target.value, 10)
            : target.value;
    }

    // gets called when the form elements are changed by the user
    private handleChange(event: React.FormEvent<HTMLElement>): boolean {
        const target = event.target as HTMLInputElement | HTMLSelectElement; // TODO: more types
        const value = this.parseChangedSetting(target);
        return this.doHandleChange(target.id, value);
    }

    private doHandleChange(setting: string, value: unknown): boolean {
        // store the setting
        this.putSetting(setting, value, () => {
            // and notify the admin UI about changes
            // TODO: implement!
            //this.props.onChange(composeObject(entries(this.state).filter(([k, v]) => !k.startsWith('_'))));
        });
        return false;
    }

    /**
     * Reads a setting from the state object and transforms the value into the correct format
     * @param key The setting key to lookup
     */
    private getSetting(key: string, defaultValue?: unknown): unknown {
        const ret = this.state[key];
        return ret != undefined ? ret : defaultValue;
    }
    /**
     * Saves a setting in the state object and transforms the value into the correct format
     * @param key The setting key to store at
     */
    private putSetting(key: string, value: unknown, callback?: () => void): void {
        this.setState({ [key]: value }, callback);
    }

    public componentDidMount(): void {
        // update floating labels in materialize design
        M.updateTextFields();

        // Fix materialize checkboxes
        if (this.chkWriteLogFile != null) {
            $(this.chkWriteLogFile).on('click', this.handleChange as any);
        }

        // Try to retrieve a list of serial ports
        sendTo(null, 'getSerialPorts', null, ({ error, result }) => {
            if (error) {
                console.error(error);
            } else if (result && result.length) {
                this.setState({ _serialports: result });
            }
        });
    }

    public componentWillUnmount(): void {
        // Fix materialize checkboxes
        if (this.chkWriteLogFile != null) {
            $(this.chkWriteLogFile).off('click', this.handleChange as any);
        }
    }

    public componentDidUpdate(): void {
        // update floating labels in materialize design
        M.updateTextFields();
    }

    public render(): ReactNode {
        // Add the currently configured serial port to the list if it is not in there
        const serialports = this.state._serialports;
        if (serialports && this.state.serialport && !serialports.includes(this.state.serialport)) {
            serialports.unshift(this.state.serialport);
        }
        return (
            <>
                <div className="row">
                    <div className="col s6">
                        <label htmlFor="writeLogFile">
                            <input
                                type="checkbox"
                                className="value"
                                id="writeLogFile"
                                defaultChecked={this.getSetting('writeLogFile') as any}
                                ref={(me) => (this.chkWriteLogFile = me)}
                            />
                            <CheckboxLabel text="Write a detailed logfile" />
                        </label>
                        <br />
                        <span>{_('This should only be set for debugging purposes.')}</span>
                    </div>
                </div>
            </>
        );
    }
}