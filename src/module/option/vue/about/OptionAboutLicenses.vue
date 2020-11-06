<template>
  <b-card class="shadow" no-body>
    <b-card-header class="h6">📝 {{ translate(i18nOptionsKeys.options_about_licences) }}</b-card-header>
    <b-card-body>
      <details>
        <summary>Vue</summary>
        <pre>{{ vue_licence }}</pre>
      </details>
      <details>
        <summary>Bootstrap</summary>
        <pre>{{ bootstrap_licence }}</pre>
      </details>
      <details>
        <summary>Bootstrap Icons</summary>
        <pre>{{ bootstrap_icons_licence }}</pre>
      </details>
      <details>
        <summary>Vue Bootstrap</summary>
        <pre>{{ vue_bootstrap_licence }}</pre>
      </details>
    </b-card-body>
  </b-card>
</template>

<script lang="ts">
import {Component} from "vue-property-decorator";
import BaseComponent from "../../../general/BaseComponent.vue";

@Component
export default class OptionAboutLicenses extends BaseComponent {
  private get vue_licence(): string {
    return `                      The MIT License (MIT)

                      Copyright (c) 2013-present, Yuxi (Evan) You

                      Permission is hereby granted, free of charge, to any person obtaining a copy
                      of this software and associated documentation files (the "Software"), to deal
                      in the Software without restriction, including without limitation the rights
                      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                      copies of the Software, and to permit persons to whom the Software is
                      furnished to do so, subject to the following conditions:

                      The above copyright notice and this permission notice shall be included in
                      all copies or substantial portions of the Software.

                      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                      OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
                      THE SOFTWARE.`

  }

  private get bootstrap_icons_licence(): string {
    return `                      The MIT License (MIT)

                      Copyright (c) 2019 The Bootstrap Authors

                      Permission is hereby granted, free of charge, to any person obtaining a copy
                      of this software and associated documentation files (the "Software"), to deal
                      in the Software without restriction, including without limitation the rights
                      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                      copies of the Software, and to permit persons to whom the Software is
                      furnished to do so, subject to the following conditions:

                      The above copyright notice and this permission notice shall be included in
                      all copies or substantial portions of the Software.

                      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                      OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
                      THE SOFTWARE.`
  }

  private get vue_bootstrap_licence(): string {
    return `                      The MIT License (MIT)

                      Copyright (c) 2016-2020 - BootstrapVue

                      Permission is hereby granted, free of charge, to any person obtaining a copy
                      of this software and associated documentation files (the "Software"), to deal
                      in the Software without restriction, including without limitation the rights
                      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                      copies of the Software, and to permit persons to whom the Software is
                      furnished to do so, subject to the following conditions:

                      The above copyright notice and this permission notice shall be included in all
                      copies or substantial portions of the Software.

                      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                      OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                      SOFTWARE.`
  }

  private get bootstrap_licence(): string {
    return `                      The MIT License (MIT)

                      Copyright (c) 2011-2018 Twitter, Inc.
                      Copyright (c) 2011-2018 The Bootstrap Authors

                      Permission is hereby granted, free of charge, to any person obtaining a copy
                      of this software and associated documentation files (the "Software"), to deal
                      in the Software without restriction, including without limitation the rights
                      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                      copies of the Software, and to permit persons to whom the Software is
                      furnished to do so, subject to the following conditions:

                      The above copyright notice and this permission notice shall be included in
                      all copies or substantial portions of the Software.

                      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                      OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
                      THE SOFTWARE.`;
  }
}
</script>

