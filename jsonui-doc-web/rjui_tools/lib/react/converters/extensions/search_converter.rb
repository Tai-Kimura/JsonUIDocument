# frozen_string_literal: true

# Search converter.
# Generated via `jui g converter --from docs/components/json/search.component.json`.
#
# Hand-adjustments after scaffold:
#   - Every `@{binding}` branch routes through `add_viewmodel_data_prefix` so
#     `@{foo}` resolves to `data.foo` (not a bare `foo` identifier that the
#     scaffold's default emission produces).
#   - `build_class_name` drops the scaffold's automatic `flex flex-col`
#     wrapper classes. Search owns its own chrome (inline button + portaled
#     modal) and does not want extra flex bookkeeping on the trigger.
#   - Added `onOpen` / `onResult` event prop emission — the scaffold only
#     handles value attributes.

require 'json'
require_relative '../base_converter'

module RjuiTools
  module React
    module Converters
      module Extensions
        class SearchConverter < BaseConverter
          def convert(indent = 2)
            class_name = build_class_name
            id_attr = extract_id ? %( id="#{extract_id}") : ''

            props = []
            emit_string_prop(props, 'placeholder', json['placeholder'])
            emit_string_prop(props, 'shortcut',    json['shortcut'])
            emit_number_prop(props, 'maxResults',  json['maxResults'])
            emit_string_prop(props, 'indexUrl',    json['indexUrl'])
            emit_event_prop(props,  'onOpen',      json['onOpen'])
            emit_event_prop(props,  'onResult',    json['onResult'])

            props_str = props.empty? ? '' : " #{props.join(' ')}"

            <<~JSX.chomp
              #{indent_str(indent)}<Search#{id_attr} className="#{class_name}"#{props_str} />
            JSX
          end

          protected

          def build_class_name
            # Delegate margin/padding to BaseConverter; the component owns
            # its own visual chrome, so we don't inject any flex/flex-col.
            super.to_s
          end

          private

          def binding?(value)
            value.is_a?(String) && value.start_with?('@{') && value.end_with?('}')
          end

          def binding_ref(value)
            add_viewmodel_data_prefix(value[2..-2])
          end

          def emit_string_prop(props, key, value)
            return if value.nil?
            if binding?(value)
              props << "#{key}={#{binding_ref(value)}}"
            elsif (resolved = convert_string_key(value))
              # Snake_case key that resolves in strings.json → emit StringManager ref.
              # Unregistered identifiers (e.g. shortcut "cmd+k") fall through.
              props << "#{key}=#{resolved}"
            else
              escaped = value.to_s.gsub('\\') { '\\\\' }.gsub('`') { '\\`' }.gsub('${') { '\\${' }
              props << "#{key}={`#{escaped}`}"
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

          def emit_event_prop(props, key, value)
            return if value.nil?
            return unless binding?(value)
            props << "#{key}={#{binding_ref(value)}}"
          end
        end
      end
    end
  end
end
