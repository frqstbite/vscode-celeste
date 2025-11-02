import * as vscode from 'vscode';

export function disposeAll(disposables: vscode.Disposable[]): void {
	while (disposables.length) {
		const item = disposables.pop();
		if (item) {
			item.dispose();
		}
	}
}

/**
 * Base class for resources that should be disposed of when no longer needed.
 * Other Disposable objects can be registered for auxillary disposal, and when this object is disposed of, all auxillary disposables will be disposed of as well.
 */
export abstract class Disposable extends vscode.Disposable {
	private _isDisposed = false;

	protected _disposables: vscode.Disposable[] = [];

	private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());
	/**
	 * Fired when this object is disposed of.
	 */
	public readonly onDidDispose = this._onDidDispose.event;

	public dispose(): any {
		if (this._isDisposed) {
			return;
		}
		this._isDisposed = true;
		disposeAll(this._disposables);
	}

	/**
	 * Tracks a value and disposes of it when this object is disposed of.
	 * @param value The disposable to register
	 * @returns
	 */
	protected _register<T extends vscode.Disposable>(value: T): T {
		if (this._isDisposed) {
			value.dispose();
		} else {
			this._disposables.push(value);
		}
		return value;
	}

	protected get isDisposed(): boolean {
		return this._isDisposed;
	}
}
