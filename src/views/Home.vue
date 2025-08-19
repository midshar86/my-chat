<template>
  <div class="root">
    <div class="ipt-container">
      <input class="ipt" type="text" v-model="ipt" placeholder="请输入问题描述">
      <button class="btn" @click="handleAskAgainEvt" :disabled="isDisabled">重新询问</button>
    </div>
    <div class="conversition" v-html="marked(str)"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { streamSSE } from "@/utils/stream"
import { auth } from '@/config/auth';
import { marked } from 'marked';
const str = ref('')
const ipt = ref('')
const isDisabled = ref(false)
const handleAskAgainEvt = () => {
  if (!ipt.value) {
    alert('请输入问题')
    return
  }
  str.value = ''
  isDisabled.value = true
  streamSSE({
    url: '/chat/completions',
    method: 'POST',
    body: JSON.stringify({
      model: "THUDM/GLM-4-9B-0414",
      stream: true,
      messages: [
        {
          content: ipt.value,
          role: "user",
        },
      ],
    }),
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + auth,
    }
  }, (data) => {
    // console.log("data==>", data);
    str.value += data
  }).then(res => {
    console.log("done==>", res);
    isDisabled.value = false
  }).catch(err => {
    console.warn(err);
  })
}

</script>

<style scoped lang='scss'>
.root {
  .ipt-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 500px;

    .ipt {
      outline: none;
      border: none;
      border-bottom: 1px solid #ccc;
      line-height: 40px;
      text-indent: 1em;
      font-size: medium;
      transition: all 0.3s;

      &:focus {
        border-bottom: 1px solid rgb(19, 106, 219);
      }
    }

    .btn {
      outline: none;
      background-color: rgb(19, 106, 219);
      border: none;
      line-height: 40px;
      width: 120px;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background-color: rgb(14, 85, 179);
      }
      &:disabled{
        cursor: not-allowed;
      }
    }
  }

  .conversition {
    margin: 20px 0;
    background-color: #f5f5f5;
    box-sizing: border-box;
    padding: 20px;
  }
}
</style>