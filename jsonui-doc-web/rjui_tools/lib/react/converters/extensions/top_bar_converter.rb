# frozen_string_literal: true

# TopBar converter.
# Generated via `jui g converter --from docs/components/json/topbar.component.json`.
#
# Hand-adjustments after scaffold:
#   - Every `@{binding}` branch routes through `add_viewmodel_data_prefix(...)`
#     so `@{foo}` resolves to `data.foo`.
#   - `build_class_name` drops the scaffold's auto-inserted `flex flex-col`.
#     TopBar owns its own chrome via CSS (<header> with fixed positioning).
#   - Added `onToggleLanguage` and `onToggleMobileMenu` event-prop emission
#     via `emit_event_prop`.
#
# This file is NOT marked @generated — editing is expected.

require 'json'
require_relative '../base_converter'

module RjuiTools
  module React
    module Converters
      module Extensions
        class TopBarConverter < BaseConverter
          def convert(indent = 2)
            class_name = build_class_name
            id_attr = extract_id ? %( id="#{extract_id}") : ''

            props = []
            emit_string_prop(props, 'brandLabel',       json['brandLabel'])
            emit_string_prop(props, 'brandHref',        json['brandHref'])
            emit_string_prop(props, 'currentLanguage',  json['currentLanguage'])
            emit_event_prop(props,  'onToggleLanguage', json['onToggleLanguage'])
            emit_event_prop(props,  'onToggleMobileMenu', json['onToggleMobileMenu'])

            props_str = props.empty? ? '' : " #{props.join(' ')}"

            <<~JSX.chomp
              #{indent_str(indent)}<TopBar#{id_attr} className="#{class_name}"#{props_str} />
            JSX
          end

          protected

          def build_class_name
            # TopBar owns its own chrome (<header>, fixed positioning, palette).
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
              props << "#{key}=#{resolved}"
            else
              escaped = value.to_s.gsub('\\') { '\\\\' }.gsub('`') { '\\`' }.gsub('${') { '\\${' }
              props << "#{key}={`#{escaped}`}"
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
