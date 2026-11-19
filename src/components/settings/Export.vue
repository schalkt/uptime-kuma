<template>
    <div>
        <div class="my-4">
            <p>{{ $t("exportMonitorsDescription") }}</p>

            <div class="form-check form-switch my-3">
                <input
                    id="exportIncludeSensitive"
                    v-model="includeSensitiveData"
                    class="form-check-input"
                    type="checkbox"
                />
                <label class="form-check-label" for="exportIncludeSensitive">
                    {{ $t("exportIncludeSensitiveData") }}
                </label>
                <div class="form-text">{{ $t("exportIncludeSensitiveDataDescription") }}</div>
            </div>

            <button class="btn btn-primary" type="button" :disabled="processing" @click="exportMonitors">
                <font-awesome-icon icon="download" />
                {{ $t("Export JSON") }}
            </button>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            includeSensitiveData: false,
            processing: false,
        };
    },

    methods: {
        /**
         * Request the export from the server and download it as a JSON file
         * @returns {void}
         */
        exportMonitors() {
            this.processing = true;

            this.$root.getSocket().emit("exportMonitors", this.includeSensitiveData, (res) => {
                this.processing = false;

                if (!res.ok) {
                    this.$root.toastRes(res);
                    return;
                }

                const json = JSON.stringify(res.data, null, 4);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

                const a = document.createElement("a");
                a.href = url;
                a.download = `uptime-kuma-monitors-${date}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            });
        },
    },
};
</script>
