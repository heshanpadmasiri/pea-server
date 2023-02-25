import { Metadata } from "./services";

export function get_file_data_and_update_state<T>(data_provider: () => Promise<T[]>,
                                                  set_files: (value: T[]) => void,
                                                  set_is_loading: (value: boolean) => void,
                                                  set_is_error: (value: boolean) => void) {
    data_provider().then((files) => {
        set_files(files);
    }).catch((_) => {
        set_is_error(true);
    }).finally(() => {
        set_is_loading(false);
    });
}
