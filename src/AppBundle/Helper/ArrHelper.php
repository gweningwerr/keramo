<?php
namespace AppBundle\Helper;

/*
 * class: ArrHelper
 * -----------------------------------------------------
 * Лезпер по работе с пассивами
 * @package AppBundle\Helper
 */

class ArrHelper
{


	/**
	 * Добавить указанную пару ключ/значение в массив, если она там ещё не существует.
	 *
	 * $array = array('foo' => 'bar');
	 * $array = array_add($array, 'key', 'value');
	 *
	 * @param $array
	 * @param $key
	 * @param $value
	 * @return mixed
	 */
	public static function add($array, $key, $value)
	{
		if (is_null(static::get($array, $key))) {
			static::set($array, $key, $value);
		}

		return $array;
	}

	/**
	 * Вернуть значение из многоуровневого массива, используя синтаксис имени с точкой.
	 *
	 * $array = array('names' => array('joe' => array('programmer')));
	 * $value = array_get($array, 'names.joe');
	 * $value = array_get($array, 'names.john', 'default');
	 *
	 * @param  array   $array
	 * @param  string  $key
	 * @param  mixed   $default
	 * @return mixed
	 */
	public static function get($array, $key, $default = null)
	{
		if (is_null($key)) {
			return $array;
		}

		if (isset($array[$key])) {
			return $array[$key];
		}

		foreach (explode('.', $key) as $segment) {
			if (! is_array($array) || ! array_key_exists($segment, $array)) {
				return $default;
			}

			if (empty($array[$segment])) {
				return $default;
			}

			$array = $array[$segment];
		}

		return $array;
	}

	/**
	 * Установить значение в многоуровневом массиве, используя синтаксис имени с точкой.
	 * $array = array('names' => array('programmer' => 'Joe'));
	 * array_set($array, 'names.editor', 'Taylor');
	 *
	 * @param  array   $array
	 * @param  string  $key
	 * @param  mixed   $value
	 * @return array
	 */
	public static function set(&$array, $key, $value)
	{
		if (is_null($key)) {
			return $array = $value;
		}

		$keys = explode('.', $key);

		while (count($keys) > 1) {
			$key = array_shift($keys);
			if (! isset($array[$key]) || ! is_array($array[$key])) {
				$array[$key] = [];
			}

			$array = &$array[$key];
		}

		$array[array_shift($keys)] = $value;

		return $array;
	}

	/**
	 * Сделать многоуровневый массив плоским.
	 * $array = array('name' => 'Joe', 'languages' => array('PHP', 'Ruby'));
	 * $array = array_flatten($array);
	 * array('Joe', 'PHP', 'Ruby');
	 * @param $array
	 * @param $depth
	 * @return mixed
	 */
	public static function flatten($array, $depth = INF)
	{
		return array_reduce($array, function ($result, $item) use ($depth) {

			if (is_array($item)) {
				if ($depth === 1) {
					return array_merge($result, $item);
				}

				return array_merge($result, static::flatten($item, $depth - 1));
			}

			$result[] = $item;

			return $result;
		}, []);
	}

	/**
	 * Сделать многоуровневый массив одноуровневым, объединяя вложенные массивы с помощью точки в именах.
	 * $array = array('foo' => array('bar' => 'baz'));
	 * $array = array_dot($array);
	 * array('foo.bar' => 'baz');
	 * @param $array
	 * @param string $prepend
	 * @return array
	 */
	public static function dot($array, $prepend = '')
	{
		$results = [];

		foreach ($array as $key => $value) {
			if (is_array($value)) {
				$results = array_merge($results, static::dot($value, $prepend.$key.'.'));
			} else {
				$results[$prepend.$key] = $value;
			}
		}

		return $results;
	}

	/**
	 * Перевод одноуровнего массива с точкой, в многоуровневый
	 * @param $array
	 *
	 * @return array
	 */
	public static function unDot($array)
	{
		$results = [];

		foreach ($array as $key => $value) {
			$key = explode('.', $key);

			switch (count($key)) {
				case 1:
					$results[$key[0]] = $value;
					break;
				case 2:
					$results[$key[0]][$key[1]] = $value;
					break;
				case 3:
					$results[$key[0]][$key[1]][$key[2]] = $value;
					break;
				case 4:
					$results[$key[0]][$key[1]][$key[2]][$key[3]] = $value;
					break;
				case 5:
					$results[$key[0]][$key[1]][$key[2]][$key[3]][$key[4]] = $value;
					break;
				case 6:
					$results[$key[0]][$key[1]][$key[2]][$key[3]][$key[4]][$key[5]] = $value;
					break;
			}
		}

		return $results;
	}

	/**
	 * Удалить указанную пару ключ/значение из многоуровневого массива, используя синтаксис имени с точкой.
	 *
	 * $array = array('names' => array('joe' => array('programmer')));
	 * array_forget($array, 'names.joe');
	 *
	 * @param $array
	 * @param $keys
	 */
	public static function forget(&$array, $keys)
	{
		$original = &$array;

		$keys = (array) $keys;

		if (count($keys) === 0) {
			return;
		}

		foreach ($keys as $key) {
			$parts = explode('.', $key);

			// clean up before each pass
			$array = &$original;

			while (count($parts) > 1) {
				$part = array_shift($parts);

				if (isset($array[$part]) && is_array($array[$part])) {
					$array = &$array[$part];
				} else {
					continue 2;
				}
			}

			unset($array[array_shift($parts)]);
		}
	}


}

