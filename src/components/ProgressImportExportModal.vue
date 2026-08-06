<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import useClipboard from 'vue-clipboard3'
import { useDialog } from '@/utils/dialog'
import MyModal from '@/components/ui/MyModal.vue'
import { useStore } from '@/stores'
import { encodeProgress, decodeProgress } from '@/tools/progress-codec'
import { ContentCopyOutlined, FileDownloadOutlined, ImportExportOutlined } from '@vicons/material'

const showModal = defineModel<boolean>('show', { required: true })

const store = useStore()
const message = useMessage()
const { confirmWarning } = useDialog()
const { toClipboard } = useClipboard()

const activeTab = ref<'export' | 'import'>('export')
const exportCode = ref('')
const importCode = ref('')
const isImporting = ref(false)
const exportContainerRef = ref<HTMLElement | null>(null)

watch(
  showModal,
  (val) => {
    if (val) {
      try {
        exportCode.value = encodeProgress(store.userData)
      } catch (err: any) {
        exportCode.value = ''
        message.error(`生成导出码失败: ${err?.message || err}`)
      }
      importCode.value = ''
    }
  }
)

// 复制导出的文本
const handleCopy = async () => {
  if (!exportCode.value) return
  try {
    await toClipboard(exportCode.value, exportContainerRef.value || undefined)
    message.success('导出码已复制到剪贴板！')
  } catch (err) {
    console.log(err)
    message.error('复制失败，请手动选择框内文本复制')
  }
}

// 确认导入
const handleImport = async () => {
  const trimmed = importCode.value.trim()
  if (!trimmed) {
    message.warning('请输入导入码字符串')
    return
  }

  try {
    // 校验解析
    const parsedData = decodeProgress(trimmed)

    if (!await confirmWarning('将覆盖您当前所有的肝武进度数据。要继续吗?')) return

    try {
      isImporting.value = true
      Object.assign(store.userData.relicProgress, parsedData.relicProgress)
      Object.assign(store.userData.relicPreProgress, parsedData.relicPreProgress)
      store.updateUserData()
      message.success('肝武进度导入成功！')
      showModal.value = false
    } catch (err: any) {
      message.error(`保存数据失败: ${err?.message || err}`)
    } finally {
      isImporting.value = false
    }
  } catch (err: any) {
    message.error(err?.message || '导入码无法解析')
  }
}
</script>

<template>
  <MyModal
    v-model:show="showModal"
    title="导入 / 导出肝武进度"
    :icon="ImportExportOutlined"
    max-width="520px"
  >
    <n-tabs v-model:value="activeTab" type="segment" animated>
      <!-- 导出 Tab -->
      <n-tab-pane name="export" tab="导出进度">
        <div ref="exportContainerRef" class="h-50 flex flex-col gap-3 py-2">
          <n-input
            v-model:value="exportCode"
            type="textarea"
            readonly
            placeholder="导出码生成中..."
          />
          <div class="flex justify-end mt-auto">
            <n-button type="primary" @click="handleCopy">
              <template #icon>
                <n-icon><ContentCopyOutlined /></n-icon>
              </template>
              复制
            </n-button>
          </div>
        </div>
      </n-tab-pane>

      <!-- 导入 Tab -->
      <n-tab-pane name="import" tab="导入进度">
        <div class="h-50 flex flex-col gap-3 py-2">
          <n-input
            v-model:value="importCode"
            type="textarea"
            placeholder="请在此粘贴导出码字符串..."
          />

          <div class="flex justify-end mt-auto">
            <n-button
              type="primary"
              :loading="isImporting"
              :disabled="!importCode.trim()"
              @click="handleImport"
            >
              <template #icon>
                <n-icon><FileDownloadOutlined /></n-icon>
              </template>
              确认
            </n-button>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </MyModal>
</template>

<style scoped>
</style>

