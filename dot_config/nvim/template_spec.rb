require 'tempfile'

CWD = File.dirname(__FILE__)
TEMPLATE = File.join(CWD, './run_onchange_after_compile_fennel.tmpl')

def compiled_template
  `chezmoi execute-template < #{TEMPLATE}`
end

describe 'template' do
  context 'without changing sources' do
    it 'stays the same' do
      compilation_one = compiled_template
      compilation_two = compiled_template

      expect(compilation_one).to eq compilation_two
    end
  end

  context 'when a new file is added' do
    it 'changes the template' do
      compilation_one = compiled_template

      @test_fnl.write('(print "Hello, World!")')
      @test_fnl.flush

      compilation_two = compiled_template

      expect(compilation_one).not_to eq compilation_two
    end

    before do
      @test_fnl = Tempfile.new(['test', '.fnl'], CWD)
    end

    after do
      @test_fnl.close
      @test_fnl.delete
    end
  end

  context 'when a file changes' do
    it 'changes the template' do
      @test_fnl.write('(print "Hello, World!")')
      @test_fnl.flush

      compilation_one = compiled_template

      @test_fnl.write('(print "Hello, World!")')
      @test_fnl.flush

      compilation_two = compiled_template

      expect(compilation_one).not_to eq compilation_two
    end

    before do
      @test_fnl = Tempfile.new(['test', '.fnl'], CWD)
    end

    after do
      @test_fnl.close
      @test_fnl.delete
    end
  end
end
