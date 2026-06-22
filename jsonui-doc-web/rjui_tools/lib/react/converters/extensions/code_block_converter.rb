# frozen_string_literal: true

# CodeBlock converter.
# Generated via `jui g converter --from docs/components/json/codeblock.component.json`.
#
# Hand-adjustments after scaffold:
#   - Every `@{binding}` branch wraps the extracted prop name with
#     `add_viewmodel_data_prefix(...)` so it resolves to `data.xxx` when the
#     converter is called inside a cell context (or any view whose state lives
#     on the ViewModel's data object). The scaffold leaves the name bare,
#     which compiles only when a local `xxx` identifier is in scope.
#   - `build_class_name` drops the scaffold's automatic `flex flex-col` wrapper
#     classes. CodeBlock owns its own visual chrome (rounded card, caption,
#     gutter) and the wrapper sits in flow without extra flex bookkeeping.
#
# This file is NOT marked @generated — editing is expected. The spec is the
# source of truth for the prop CONTRACT; the React component owns the
# rendering behavior (Shiki highlight, copy button, line numbers, etc.).

require 'json'
require_relative '../base_converter'

module RjuiTools
  module React
    module Converters
      module Extensions
        class CodeBlockConverter < BaseConverter
          def convert(indent = 2)
            class_name = build_class_name
            id_attr = extract_id ? %( id="#{extract_id}") : ''

            props = []
            emit_string_prop(props, 'code', json['code'])
            emit_string_prop(props, 'language', json['language'])
            emit_string_prop(props, 'filename', json['filename'])
            emit_bool_prop(props, 'showLineNumbers', json['showLineNumbers'])
            emit_number_prop(props, 'startLine', json['startLine'])
            emit_array_prop(props, 'highlightLines', json['highlightLines'])
            emit_bool_prop(props, 'wrapLines', json['wrapLines'])
            emit_bool_prop(props, 'copyable', json['copyable'])
            emit_number_prop(props, 'maxHeight', json['maxHeight'])
            emit_string_prop(props, 'theme', json['theme'])
            emit_event_prop(props, 'onCopy', json['onCopy'])

            props_str = props.empty? ? '' : " #{props.join(' ')}"

            # CodeBlock is a leaf — spec declares empty slots. Ignore any children in layout.
            <<~JSX.chomp
              #{indent_str(indent)}<CodeBlock#{id_attr} className="#{class_name}"#{props_str} />
            JSX
          end

          protected

          def build_class_name
            # BaseConverter#build_class_name would also map json['maxHeight'] to a
            # Tailwind max-h-* utility, but CodeBlock treats `maxHeight` as a
            # COMPONENT prop (pixels, caps the inner code region). Temporarily
            # hide it from super so the wrapper div doesn't get a conflicting
            # max-height class. (Library fix rjui-baseconverter-maxheight-collision
            # now excludes component-declared props from decoration, so this
            # guard is belt-and-suspenders — kept for clarity.)
            saved_max_height = json.delete('maxHeight')
            base = super.to_s
            json['maxHeight'] = saved_max_height unless saved_max_height.nil?
            base
          end

          private

          def binding?(value)
            value.is_a?(String) && value.start_with?('@{') && value.end_with?('}')
          end

          def binding_ref(value)
            # Strip @{...} then route through BaseConverter so `data.` is
            # prepended when the prop is resolved in a ViewModel/cell scope.
            add_viewmodel_data_prefix(value[2..-2])
          end

          def emit_string_prop(props, key, value)
            return if value.nil?
            if binding?(value)
              props << "#{key}={#{binding_ref(value)}}"
            elsif (resolved = convert_string_key(value))
              # Snake_case key that resolves in strings.json → StringManager ref.
              # Shiki identifiers (`language: "bash"`, `theme: "github-dark"`)
              # and literal filenames (`filename: "shell"`) don't resolve, so
              # `convert_string_key` returns nil and they fall through literal.
              props << "#{key}=#{resolved}"
            else
              escaped = value.to_s.gsub('\\') { '\\\\' }.gsub('`') { '\\`' }.gsub('${') { '\\${' }
              props << "#{key}={`#{escaped}`}"
            end
          end

          def emit_bool_prop(props, key, value)
            return if value.nil?
            if binding?(value)
              props << "#{key}={#{binding_ref(value)}}"
            else
              props << "#{key}={#{value ? 'true' : 'false'}}"
            end
          end

          def emit_number_prop(props, key, value)
            return if value.nil?
            if binding?(value)
              props << "#{key}={#{binding_ref(value)}}"
            else
              props << "#{key}={#{value}}"
            end
          end

          def emit_array_prop(props, key, value)
            return if value.nil?
            if binding?(value)
              props << "#{key}={#{binding_ref(value)}}"
            else
              # Serialize the array as JSON so JSX gets a real JS literal.
              props << "#{key}={#{JSON.generate(value)}}"
            end
          end

          def emit_event_prop(props, key, value)
            return if value.nil?
            # onCopy is the sole exposed event. It MUST be a @{handler} binding;
            # inline function bodies are not supported.
            return unless binding?(value)
            props << "#{key}={#{binding_ref(value)}}"
          end
        end
      end
    end
  end
end
