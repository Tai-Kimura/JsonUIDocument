# frozen_string_literal: true

# TableOfContents converter.
# Generated via `jui g converter --from docs/components/json/tableofcontents.component.json`.
#
# Hand-adjustments after scaffold:
#   - Every `@{binding}` branch wraps the extracted prop name with
#     `add_viewmodel_data_prefix(...)` so it resolves to `data.xxx` when the
#     converter is called from a VM-driven screen. The scaffold leaves the
#     name bare, which only compiles if a local `xxx` identifier happens to
#     be in scope.
#   - `build_class_name` drops the scaffold's automatic `flex flex-col` wrapper
#     classes. The React component owns its own visual chrome (sticky nav,
#     indentation per level, active-row highlight) and the wrapper sits in
#     flow without extra flex bookkeeping.
#   - `onSelect` (event prop) routed through `emit_event_prop` like CodeBlock's
#     onCopy pattern. Scaffold had no event emission path — the component spec
#     exposes `onSelect(anchor: String) -> Void` as the only event.
#
# This file is NOT marked @generated — editing is expected. The spec is the
# source of truth for the prop CONTRACT; the React component owns the
# rendering behavior (sticky, IntersectionObserver, scroll-to-anchor).

require 'json'
require_relative '../base_converter'

module RjuiTools
  module React
    module Converters
      module Extensions
        class TableOfContentsConverter < BaseConverter
          def convert(indent = 2)
            class_name = build_class_name
            id_attr = extract_id ? %( id="#{extract_id}") : ''

            props = []
            emit_array_prop(props, 'items', json['items'])
            emit_string_prop(props, 'title', json['title'])
            emit_bool_prop(props, 'sticky', json['sticky'])
            emit_number_prop(props, 'stickyOffset', json['stickyOffset'])
            emit_string_prop(props, 'activeAnchor', json['activeAnchor'])
            emit_number_prop(props, 'maxDepth', json['maxDepth'])
            emit_event_prop(props, 'onSelect', json['onSelect'])

            props_str = props.empty? ? '' : " #{props.join(' ')}"

            # TableOfContents is a leaf — spec declares no slots. Ignore any children in layout.
            <<~JSX.chomp
              #{indent_str(indent)}<TableOfContents#{id_attr} className="#{class_name}"#{props_str} />
            JSX
          end

          protected

          def build_class_name
            # Delegate margin/padding/etc. to BaseConverter. The component owns
            # its own visual chrome (nav wrapper, indentation, highlight), so
            # no flex/padding classes are injected here.
            super.to_s
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
              # `convert_string_key` returns `{StringManager.currentLanguage.xxx}`
              # only when `value` is a snake_case key AND resolves via Phase 1/2/3
              # lookup. Unregistered identifiers fall through to the literal branch.
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
              # `rewrite_json_string_values` walks the JSON-encoded array and
              # swaps value-side snake_case strings that resolve in strings.json
              # with `StringManager.currentLanguage.xxx` refs. Identifiers that
              # don't resolve (anchor ids, TOC row ids) stay literal.
              props << "#{key}={#{rewrite_json_string_values(JSON.generate(value))}}"
            end
          end

          def emit_event_prop(props, key, value)
            return if value.nil?
            # onSelect is the sole exposed event. It MUST be a @{handler} binding;
            # inline function bodies are not supported.
            return unless binding?(value)
            props << "#{key}={#{binding_ref(value)}}"
          end
        end
      end
    end
  end
end
